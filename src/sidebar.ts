import { reactive, html } from "@arrow-js/core";
import * as h from "./helpers";
import typeahead from 'typeahead-standalone';

const SIMSAPA_BASE_URL = "http://localhost:4848";
const SEARCH_TIMER_SPEED = 400;
let SELECTED_IDX: number | null = null;

let TYPING_TIMEOUT: ReturnType<typeof setInterval> = setTimeout(() => {}, 1);
let SERVER_CHECK_TIMEOUT: ReturnType<typeof setInterval> = setTimeout(() => {}, 1);

const DATA = reactive({
  search_results: [],
  search_count_msg: "",
});

const IS_FIREFOX = (typeof browser !== "undefined");
// const IS_CHROME = (typeof chrome !== "undefined" && chrome.hasOwnProperty('sidePanel'));
const IS_OBSIDIAN = (typeof chrome !== "undefined" && !chrome.hasOwnProperty('sidePanel'));

// key from current result
function cr(key: string): string {
  if (SELECTED_IDX !== null) {
    return DATA.search_results[SELECTED_IDX][key];
  } else {
    return '';
  }
}

if (IS_FIREFOX) {
  // Close the sidebar when the extension icon is clicked again.
  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.close();
  });
}

function search_result_onclick(idx: number): void {
  let el = <HTMLElement>document.querySelector("#search-results .dpd-word[data-idx='"+idx+"']");
  let cur = document.querySelector("#search-results .selected");
  if (cur) {
    cur.classList.remove('selected');
  }
  el.classList.add('selected');
  SELECTED_IDX = Number(el.dataset.idx);
};

function search_handler(min_length = 4): void {
  const el = <HTMLInputElement>document.getElementById('query-text')!;
  const query_text = el.value;

  if (!h.is_numeric(query_text) && query_text.length < min_length) {
    return;
  }

  const url = SIMSAPA_BASE_URL + "/dpd_search";
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
      DATA.search_count_msg = resp.length + " results";
      DATA.search_results = resp;
    })
    .catch(error => console.error('Error:', error));
}

function show_dpd_word_handler(dpd_id: number): void {
  const url = SIMSAPA_BASE_URL + "/lookup_window_query";
  const data = { query_text: dpd_id.toString() };

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
  let selected_text = window.getSelection().toString();

  const el = <HTMLInputElement>document.getElementById('query-text')!;
  el.value = selected_text;

  search_handler();
}

const search_results_template = html`
<div>
  ${() => DATA.search_results.map(
      (item: any, idx) => {
        return html`
        <div
          class="dpd-word"
          data-idx="${idx}"
          @click="${() => { search_result_onclick(idx) }}"
        >
          <div class="dpd-header">
            <b>${item.pali_1} (#${item.id})</b>
            <button
              class="show-word-in-simsapa"
              title="Show word in Simsapa"
              style="min-width: 29px; height: 25px; line-height: 25px; font-size: 15px; padding: 0 7px;"
              @click="${() => show_dpd_word_handler(item.id)}"
             >
              <svg class="icon"><use xlink:href="#icon-square-up-right-solid"></use></svg>
            </button>
          </div>
          <div class="dpd-meaning">${item.meaning_1}</div>
          <div class="dpd-details">
            <span>${item.grammar}</span>; <span>${item.construction}</span>
          </div>
        </div>
        `.key(item.id);
      }
   )}
</div>`;

search_results_template(document.getElementById('search-results')!);

const search_count_template = html`<span>${() => DATA.search_count_msg}</span>`;
search_count_template(document.getElementById('search-count')!);

function copy_gloss(): void {
  if (SELECTED_IDX === null) {
    return;
  }

  const el = <HTMLInputElement | null>document.getElementById("gloss-keys-csv");
  if (!el) {
    return;
  }

  const item_keys = el.value.split(",").map(i => i.trim());

  const item_values = item_keys.map(key => DATA.search_results[SELECTED_IDX!][key]);


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
  const search_input_el = <HTMLInputElement>document.getElementById("query-text");

  typeahead({
    input: search_input_el,
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
        url: SIMSAPA_BASE_URL + '/dpd_word_completion_list',
        when: 'onInit',
        done: false,
      },
    },
    onSubmit: (__e__, __selected_suggestion__) => {
      search_handler();
    },
  });

  // In the Chrome extension, .tt-list gets an inline style value "width: 8px",
  // which makes the list too narrow to see any suggestion items.
  let el = document.querySelector(".typeahead-standalone .tt-list");
  if (el) {
    let style = el.getAttribute('style').replace(/width:[^;]+;/, '');
    el.setAttribute('style', style);
  }

  h.set_input('#query-text', function() {
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

  h.set_click('#copy-dpd-id', () => { h.set_clipboard_text(cr('id')) });
  h.set_click('#copy-word', () => { h.set_clipboard_text(cr('pali_1')) });
  h.set_click('#copy-meaning', () => { h.set_clipboard_text(cr('meaning_1')) });
  h.set_click('#settings-btn', () => { h.toggle_hide('#settings-wrap') });
  h.set_click('#copy-gloss', copy_gloss);
});
