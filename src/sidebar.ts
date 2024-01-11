import { reactive, html, ReactiveProxy } from "@arrow-js/core";
import * as h from "./helpers";
import typeahead from 'typeahead-standalone';

import _assets_dict_words from "./assets/dict_words_flat_completion_list.json";
const dict_words_flat_completion_list = _assets_dict_words as string[];

const SIMSAPA_BASE_URL = "http://localhost:4848";
const SEARCH_TIMER_SPEED = 400;
let SELECTED_IDX: number | null = null;

let TYPING_TIMEOUT: ReturnType<typeof setInterval> = setTimeout(() => {}, 1);
let SERVER_CHECK_TIMEOUT: ReturnType<typeof setInterval> = setTimeout(() => {}, 1);

interface SearchResult {
    uid: string;
    schema_name: string;
    table_name: string;
    source_uid: string | null;
    title: string;
    ref: string | null;
    nikaya: string | null;
    author: string | null;
    snippet: string;
    page_number: Number | null;
    score: Number | null;
    rank: Number | null;
}

enum Tab {
  Suttas = "Suttas",
  Dictionary = "Dictionary",
}

const DATA = reactive({
  active_tab: Tab.Dictionary,
  sutta_results: <SearchResult[]>[],
  sutta_count_msg: "",
  dict_results: <SearchResult[]>[],
  dict_count_msg: "",
});

const IS_FIREFOX = (typeof browser !== "undefined");
// const IS_CHROME = (typeof chrome !== "undefined" && chrome.hasOwnProperty('sidePanel'));
const IS_OBSIDIAN = (typeof chrome !== "undefined" && !chrome.hasOwnProperty('sidePanel'));

function select_tab(tab: Tab) {
  DATA.active_tab = tab;

  let tab_el_sel: string;
  let control_el_sel: string;
  let results_el_sel: string;

  if (tab == Tab.Suttas) {
    tab_el_sel = '#suttas-tab';
    control_el_sel = '#suttas-controls';
    results_el_sel = '#sutta-results-wrap';
  } else {
    tab_el_sel = '#dictionary-tab';
    control_el_sel = '#dict-controls';
    results_el_sel = '#dict-results-wrap';
  }

  h.select_tab_elements(tab_el_sel, control_el_sel, results_el_sel);
}

if (IS_FIREFOX) {
  // Close the sidebar when the extension icon is clicked again.
  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.close();
  });

  // Receive the selected word from the double click event handler.
  browser.runtime.onMessage.addListener(function (message) {
    select_tab(Tab.Dictionary);

    const el = <HTMLInputElement>document.getElementById('dict-query-text')!;
    if (!el) {
      return;
    }
    el.value = message.query_text;
    search_handler();
  });
}

// Returns the value for 'key' from the selected result,
// in the active tab (Sutta or Word).
function cr(key: string): string {
  if (SELECTED_IDX === null) {
    return '';
  }

  if (DATA.active_tab == Tab.Suttas) {
    return DATA.sutta_results[SELECTED_IDX][key];
  } else {
    return DATA.dict_results[SELECTED_IDX][key];
  }
}

function search_result_onclick(idx: number, table_name: string): void {
  let tab_id: string;
  if (table_name == 'suttas') {
    tab_id = "#sutta-results";
  } else {
    tab_id = "#dict-results";
  }

  let el = <HTMLElement>document.querySelector(tab_id + " .search-result[data-idx='"+idx+"']");
  let cur = document.querySelector(tab_id + " .selected");
  if (cur) {
    cur.classList.remove('selected');
  }
  el.classList.add('selected');
  SELECTED_IDX = Number(el.dataset.idx);
};

function search_handler(min_length = 4): void {
  let url: string;
  let input_id: string;

  if (DATA.active_tab == Tab.Suttas) {
    input_id = 'suttas-query-text';
    url = SIMSAPA_BASE_URL + "/suttas_fulltext_search";
  } else {
    input_id = 'dict-query-text';
    url = SIMSAPA_BASE_URL + "/dict_combined_search";
  }

  const el = <HTMLInputElement>document.getElementById(input_id)!;
  const query_text = el.value;

  // FIXME check for sutta pattern
  //
  // def is_book_sutta_ref(ref: str) -> bool:
  //     return (re.match(RE_ALL_BOOK_SUTTA_REF, ref) is not None)
  // RE_ALL_BOOK_SUTTA_REF = re.compile(r'(?<!/)\b(DN|MN|SN|AN|Pv|Vv|Vism|iti|kp|khp|snp|th|thag|thig|ud|uda|dhp)[ \.]*(\d[\d\.:]*)\b', re.IGNORECASE)
  if (query_text.startsWith('mn')) {
    min_length = 1;
  }

  if (!h.is_numeric(query_text) && query_text.length < min_length) {
    return;
  }

  const data = { query_text: query_text };

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(resp => {
      let msg: string;
      if (resp.hits != null) {
        msg = resp.hits + " results";
      } else {
        msg = "";
      }

      if (DATA.active_tab == Tab.Suttas) {
        DATA.sutta_count_msg = msg;
        DATA.sutta_results = resp.results;
      } else {
        DATA.dict_count_msg = msg;
        DATA.dict_results = resp.results;
      }
    })
    .catch(error => console.error('Error:', error));
}

function show_in_simsapa_onclick(table_name: string, uid: string): void {
  if (table_name == 'suttas') {
    show_sutta(uid);
  } else {
    show_word(uid);
  }
}

function show_sutta(uid: string): void {
  const url = SIMSAPA_BASE_URL + "/suttas/" + uid + "?window_type=Sutta+Study";
  fetch(url).catch(error => console.error('Error:', error));
}

// FIXME use the /words/ route with ?window_type=Lookup+Window
function show_word(uid: string): void {
  const url = SIMSAPA_BASE_URL + "/lookup_window_query";
  const data = { query_text: uid };

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(data),
  })
    .catch(error => console.error('Error:', error));
}

function search_selection(): void {
  select_tab(Tab.Dictionary);
  let selected_text = window.getSelection().toString();
  const el = <HTMLInputElement>document.getElementById('dict-query-text')!;
  el.value = selected_text;
  search_handler();
}

function results_item_template(item: ReactiveProxy<SearchResult>, idx: number) {
  return html`
  <div
    class="search-result"
    data-idx="${idx}"
    @click="${() => { search_result_onclick(idx, item.table_name) }}"
  >
    <div class="result-header">
      <b>${item.title} (${item.uid})</b>
      <button
        class="show-in-simsapa"
        title="Show in Simsapa"
        style="min-width: 29px; height: 25px; line-height: 25px; font-size: 15px; padding: 0 7px;"
        @click="${() => show_in_simsapa_onclick(item.table_name, item.uid)}"
        >
        <svg class="icon"><use xlink:href="#icon-square-up-right-solid"></use></svg>
      </button>
    </div>
    <div class="result-snippet">${item.snippet}</div>
  </div>
  `.key(item.schema_name + '.' + item.uid);
}

const sutta_results_template = html`<div>${() => DATA.sutta_results.map(results_item_template)}</div>`;
const dict_results_template = html`<div>${() => DATA.dict_results.map(results_item_template)}</div>`;

sutta_results_template(document.getElementById('sutta-results')!);
dict_results_template(document.getElementById('dict-results')!);

const sutta_count_template = html`<span>${() => DATA.sutta_count_msg}</span>`;
sutta_count_template(document.getElementById('sutta-count')!);

const dict_count_template = html`<span>${() => DATA.dict_count_msg}</span>`;
dict_count_template(document.getElementById('dict-count')!);

function copy_gloss(): void {
  if (SELECTED_IDX === null) {
    return;
  }

  const el = <HTMLInputElement | null>document.getElementById("gloss-keys-csv");
  if (!el) {
    return;
  }

  const item_keys = el.value.split(",").map(i => i.trim());

  const item_values = item_keys.map(key => DATA.dict_results[SELECTED_IDX!][key]);

  if (IS_OBSIDIAN) {
    // Copy Markdown format table text.
    const md = "| " + item_values.join(" | ") + " |";
    h.set_clipboard_text(md);

  } else {
    // Copy a HTML table row.
    let html = "<table><tr><td>";

    html += item_values.join("</td><td>");

    html += "</td></tr></table>";

    const text = item_values.join("; ");

    h.set_clipboard_html(html, text);
  }
}

function server_online_init() {
  const suttas_input_el = <HTMLInputElement>document.getElementById("suttas-query-text");
  const dict_input_el = <HTMLInputElement>document.getElementById("dict-query-text");

  typeahead({
    input: suttas_input_el,
    minLength: 2,
    limit: 20,
    diacritics: true,
    highlight: true,
    // Hinting inserts another <input> above the original, going to need CSS
    // adjustments to line up.
    hint: false,
    autoSelect: true,
    preventSubmit: true,
    source: {
      prefetch: {
        url: SIMSAPA_BASE_URL + '/sutta_titles_flat_completion_list',
        when: 'onInit',
        done: false,
      },
    },
    onSubmit: (__e__, __selected_suggestion__) => {
      search_handler();
    },
  });

  typeahead({
    input: dict_input_el,
    minLength: 2,
    limit: 20,
    diacritics: true,
    highlight: true,
    hint: false,
    autoSelect: true,
    preventSubmit: true,
    source: {
      // NOTE: This is a large list to parse, so load it from a const instead of a HTTP request.
      local: dict_words_flat_completion_list,
      // prefetch: {
      //   url: SIMSAPA_BASE_URL + '/dict_words_flat_completion_list',
      //   when: 'onInit',
      //   done: false,
      // },
    },
    onSubmit: (__e__, __selected_suggestion__) => {
      search_handler();
    },
  });

  // In the Chrome extension, .tt-list gets an inline style value "width: 8px",
  // which makes the list too narrow to see any suggestion items.
  let arr = document.querySelectorAll(".typeahead-standalone .tt-list");
  arr.forEach((el) => {
    // Increase the width to 350px.
    let style = el.getAttribute('style').replace(/width:[^;]+;/, 'width: 350px;');
    el.setAttribute('style', style);
  });

  h.set_input('#suttas-query-text', function() {
    clearTimeout(TYPING_TIMEOUT);
    TYPING_TIMEOUT = setTimeout(search_handler, SEARCH_TIMER_SPEED);
  });

  h.set_input('#dict-query-text', function() {
    clearTimeout(TYPING_TIMEOUT);
    TYPING_TIMEOUT = setTimeout(search_handler, SEARCH_TIMER_SPEED);
  });

  window.addEventListener('dblclick', search_selection);
}

function check_server() {
  fetch(SIMSAPA_BASE_URL)
    .then(response => {
      if (response.ok) {
        document.getElementById('main-wrap').classList.remove('hide');
        document.getElementById('server-offline').classList.add('hide');
        clearTimeout(SERVER_CHECK_TIMEOUT);
        server_online_init();

      } else {
        throw new Error('Server is offline: ' + SIMSAPA_BASE_URL);
      }
    })
    .catch(_error => {
      document.getElementById('main-wrap').classList.add('hide');
      document.getElementById('server-offline').classList.remove('hide');
    });
}

window.addEventListener("DOMContentLoaded", function () {
  SERVER_CHECK_TIMEOUT = setInterval(check_server, 1000);

  h.set_click('#copy-uid', () => { h.set_clipboard_text(cr('uid')) });
  h.set_click('#copy-word', () => { h.set_clipboard_text(cr('title')) });
  h.set_click('#copy-meaning', () => { h.set_clipboard_text(cr('snippet')) });
  h.set_click('#settings-btn', () => { h.toggle_hide('#settings-wrap') });
  h.set_click('#copy-gloss', copy_gloss);

  h.set_click('#suttas-tab', () => { select_tab(Tab.Suttas) });
  h.set_click('#dictionary-tab', () => { select_tab(Tab.Dictionary) });
});
