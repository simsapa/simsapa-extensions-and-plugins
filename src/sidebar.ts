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

function set_dark_mode(set_dark: boolean) {
  if (set_dark) {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    localStorage.setItem('color-scheme', 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    localStorage.setItem('color-scheme', 'light');
  }
}

if (typeof window.matchMedia !== "undefined") {
  const color_scheme = localStorage.getItem('color-scheme');
  if (color_scheme === null) {
    // MediaQueryList { media: '(prefers-color-scheme: dark)', matches: true, onchange: null }
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener('change', (event) => set_dark_mode(event.matches));
    set_dark_mode(query.matches);
  } else {
    set_dark_mode(color_scheme == 'dark');
  }
}

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
  dict_deconstructor: <string[]>[],
  dict_count_msg: "",
});

const IS_FIREFOX = (typeof browser !== "undefined");
const IS_CHROME = (typeof chrome !== "undefined" && chrome.hasOwnProperty('sidePanel'));
// const IS_OBSIDIAN = (typeof chrome !== "undefined" && !chrome.hasOwnProperty('sidePanel'));

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

function toggle_include_button(el_selector: string): void {
  let el = document.querySelector(el_selector);
  if (!el) { return; }

  let is_active = el.classList.contains('active');
  if (is_active) {
    el.classList.remove('active');
    el.textContent = "-";
  } else{
    el.classList.add('active');
    el.textContent = "+";
  }
}

function get_suttas_lang(): string | null {
  const el = <HTMLSelectElement>document.querySelector("select[name='suttas-lang']");
  const opt = el.selectedOptions.item(0);
  if (!opt) {
    return null;
  } else if (opt.value == "Language") {
    return null;
  } else {
    return opt.value;
  }
}

function get_dict_lang(): string | null {
  const el = <HTMLSelectElement>document.querySelector("select[name='dict-lang']");
  const opt = el.selectedOptions.item(0);
  if (!opt) {
    return null;
  } else if (opt.value == "Language") {
    return null;
  } else {
    return opt.value;
  }
}

function get_dict_dict(): string | null {
  const el = <HTMLSelectElement>document.querySelector("select[name='dict-dict']");
  const opt = el.selectedOptions.item(0);
  if (!opt) {
    return null;
  } else if (opt.value == "Dictionaries") {
    return null;
  } else {
    return opt.value;
  }
}

function get_suttas_lang_include(): boolean {
  const el = <HTMLElement>document.getElementById("suttas-lang-include");
  return el.classList.contains("active");
}

function get_dict_lang_include(): boolean {
  const el = <HTMLElement>document.getElementById("dict-lang-include");
  return el.classList.contains("active");
}

function get_dict_dict_include(): boolean {
  const el = <HTMLElement>document.getElementById("dict-dict-include");
  return el.classList.contains("active");
}

if (IS_FIREFOX) {
  // Close the sidebar when the extension icon is clicked again.
  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.close();
  });

  // Receive the selected word from the double click event handler.
  browser.runtime.onMessage.addListener(function (message) {
    select_tab(Tab.Dictionary);

    const el = <HTMLInputElement | null>document.getElementById('dict-query-text')!;
    if (!el) { return; }
    el.value = message.query_text;
    search_handler();
  });
}

if (IS_CHROME) {
  // Receive the selected word from the double click event handler.
  chrome.runtime.onMessage.addListener(function (message) {
    select_tab(Tab.Dictionary);

    const el = <HTMLInputElement | null>document.getElementById('dict-query-text')!;
    if (!el) { return; }
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

  let suttas_lang = get_suttas_lang();
  let suttas_lang_include = get_suttas_lang_include();

  let dict_lang = get_dict_lang();
  let dict_lang_include = get_dict_lang_include();

  let dict_dict = get_dict_dict();
  let dict_dict_include = get_dict_dict_include();

  if (DATA.active_tab == Tab.Suttas) {
    input_id = 'suttas-query-text';
    url = SIMSAPA_BASE_URL + "/suttas_fulltext_search";
  } else {
    input_id = 'dict-query-text';
    url = SIMSAPA_BASE_URL + "/dict_combined_search";
  }

  const el = <HTMLInputElement>document.getElementById(input_id)!;
  const query_text = el.value;

  if (h.is_book_sutta_ref(query_text)) {
    min_length = 1;
  }

  if (!h.is_numeric(query_text) && query_text.length < min_length) {
    return;
  }

  const data = {
    query_text: query_text,
    suttas_lang: suttas_lang,
    suttas_lang_include: suttas_lang_include,
    dict_lang: dict_lang,
    dict_lang_include: dict_lang_include,
    dict_dict: dict_dict,
    dict_dict_include: dict_dict_include,
  };

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
        DATA.dict_deconstructor = resp.deconstructor;

        if (DATA.dict_deconstructor.length != 0) {
          const el = <HTMLElement>document.getElementById('dict-deconstructor-wrap');
          el.classList.remove('hide');
        } else {
          const el = <HTMLElement>document.getElementById('dict-deconstructor-wrap');
          el.classList.add('hide');
        }
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
  const sel = window.getSelection();
  if (!sel) { return; }
  let selected_text = sel.toString();
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

function deconstructor_item_template(item: ReactiveProxy<string>, _idx: number) {
  return html`<div class="deconstructor-result"><b>${item}</b></div>`.key(item);
}

const sutta_results_template = html`<div>${() => DATA.sutta_results.map(results_item_template)}</div>`;
const dict_results_template = html`<div>${() => DATA.dict_results.map(results_item_template)}</div>`;
const dict_deconstructor_template = html`<div>${() => DATA.dict_deconstructor.map(deconstructor_item_template)}</div>`;

sutta_results_template(document.getElementById('sutta-results')!);
dict_results_template(document.getElementById('dict-results')!);
dict_deconstructor_template(document.getElementById('dict-deconstructor')!);

const sutta_count_template = html`<span>${() => DATA.sutta_count_msg}</span>`;
sutta_count_template(document.getElementById('sutta-count')!);

const dict_count_template = html`<span>${() => DATA.dict_count_msg}</span>`;
dict_count_template(document.getElementById('dict-count')!);

async function copy_gloss() {
  console.log("copy_gloss()");

  if (SELECTED_IDX === null) {
    return;
  }

  const uid = cr('uid');
  const url = SIMSAPA_BASE_URL + "/words/" + uid + ".json";
  const item = await fetch(url)
    .then(response => response.json())
    .then(resp => {
      if (resp.length == 0) {
        return null;
      } else{
        return resp[0];
      }
    })
    .catch(error => console.error('Error:', error));

  // NOTE: ignore gloss-keys-csv for now

  // const el = <HTMLInputElement | null>document.getElementById("gloss-keys-csv");
  // if (!el) {
  //   return;
  // }

  // const item_keys = el.value.split(",").map(i => i.trim());

  let item_values = [];

  if (uid.endsWith('/dpd')) {
    const item_keys = ['uid', 'pali_1', 'pos', 'grammar', 'meaning_1', 'construction'];
    item_values = item_keys.map(key => item[key]);

  } else {
    const item_keys = ['uid', 'word', '', '', 'definition_plain', ''];
    item_values = item_keys.map(key => {
      if (key == '') {
        return '';

      } else if (item.hasOwnProperty(key)) {
        let s: string = '' + item[key] + '';
        if (s.length <= 100) {
          return s;
        } else {
          return s.slice(0, 100) + " ...";
        }

      } else {
        return '';
      }
    });
  }

  if (IS_FIREFOX) {
    // Copy a HTML table row.
    let html = "<table><tr><td>";

    html += item_values.join("</td><td>");

    html += "</td></tr></table>";

    const text = item_values.join("; ");

    h.set_clipboard_html(html, text);

  } else {
    // Copy Markdown format table text.
    const md = "| " + item_values.join(" | ") + " |";
    h.set_clipboard_text(md);

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
    let st = el.getAttribute('style');
    if (st) {
      let style = st.replace(/width:[^;]+;/, 'width: 350px;');
      el.setAttribute('style', style);
    }
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
        let el = <HTMLElement>document.getElementById('main-wrap');
        el.classList.remove('hide');

        el = <HTMLElement>document.getElementById('server-offline');
        el.classList.add('hide');

        clearTimeout(SERVER_CHECK_TIMEOUT);
        server_online_init();

      } else {
        throw new Error('Server is offline: ' + SIMSAPA_BASE_URL);
      }
    })
    .catch(_error => {
      let el = <HTMLElement>document.getElementById('main-wrap');
      el.classList.add('hide');

      el = <HTMLElement>document.getElementById('server-offline');
      el.classList.remove('hide');
    });
}

window.addEventListener("DOMContentLoaded", function () {
  SERVER_CHECK_TIMEOUT = setInterval(check_server, 1000);

  h.set_click('#copy-uid', () => { h.set_clipboard_text(cr('uid')) });
  h.set_click('#copy-word', () => { h.set_clipboard_text(cr('title')) });
  h.set_click('#copy-meaning', () => { h.set_clipboard_text(h.strip_html(cr('snippet'))) });
  h.set_click('#copy-gloss', () => { copy_gloss(); });
  // h.set_click('#settings-btn', () => { h.toggle_hide('#settings-wrap') });

  h.set_click('#suttas-tab', () => { select_tab(Tab.Suttas) });
  h.set_click('#dictionary-tab', () => { select_tab(Tab.Dictionary) });

  h.set_click('#suttas-lang-include', () => {
    toggle_include_button('#suttas-lang-include');
    search_handler();
  });

  h.set_click('#dict-lang-include', () => {
    toggle_include_button('#dict-lang-include');
    search_handler();
  });

  h.set_click('#dict-dict-include', () => {
    toggle_include_button('#dict-dict-include');
    search_handler();
  });

  h.set_click('#dark-mode-toggle', () => {
    set_dark_mode(!document.body.classList.contains('dark-mode'));
  });

  h.set_click('#suttas-search-submit', () => { search_handler(2); });
  h.set_click('#dict-search-submit', () => { search_handler(2); });

  h.set_change("select[name='suttas-lang']", () => { search_handler(); });
  h.set_change("select[name='dict-lang']", () => { search_handler(); });
  h.set_change("select[name='dict-dict']", () => { search_handler(); });
});
