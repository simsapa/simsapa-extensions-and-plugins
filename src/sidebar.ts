import { reactive, html } from "@arrow-js/core";
import * as h from "./helpers";

const SIMSAPA_BASE_URL = "http://localhost:4848";
const SEARCH_TIMER_SPEED = 400;
let TYPING_TIMEOUT: ReturnType<typeof setInterval> = setTimeout(() => {}, 1);
let SELECTED_IDX: number | null = null;

const DATA = reactive({
  search_results: [],
  success_msg: "",
  error_msg: "",
});

// key from current result
function cr(key: string): string {
  if (SELECTED_IDX !== null) {
    return DATA.search_results[SELECTED_IDX][key];
  } else {
    return '';
  }
}

// When loaded in the Firefox extension.
if (typeof browser !== "undefined") {
  // Close the sidebar when the extension icon is clicked again.
  browser.browserAction.onClicked.addListener(() => {
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

  if (query_text.length < min_length) {
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
      DATA.success_msg = resp.length + " results";
      DATA.search_results = resp;
    })
    .catch(error => console.error('Error:', error));
}

function show_dpd_word_handler(dpd_id: number): void {
  const url = SIMSAPA_BASE_URL + "/lookup_window_query";
  const data = { dpd_id: dpd_id };

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

const success_msg_template = html`<span>${() => DATA.success_msg}</span>`;
success_msg_template(document.getElementById('success-msg')!);

const error_msg_template = html`<span>${() => DATA.error_msg}</span>`;
error_msg_template(document.getElementById('error-msg')!);

function copy_gloss(): void {
  if (SELECTED_IDX === null) {
    return;
  }

  let html = "<table><tr><td>";

  const el = <HTMLInputElement | null>document.getElementById("gloss-keys-csv");
  if (!el) {
    return;
  }

  const item_keys = el.value.split(",")
    .map(i => i.trim());

  const item_values = item_keys.map(key => DATA.search_results[SELECTED_IDX!][key]);

  html += item_values.join("</td><td>");

  html += "</td></tr></table>";

  const text = item_values.join("; ");

  h.set_clipboard_html(html, text);
}

window.addEventListener("DOMContentLoaded", function () {
  h.set_click('#copy-dpd-id', () => { h.set_clipboard_text(cr('id')) });
  h.set_click('#copy-meaning', () => { h.set_clipboard_text(cr('meaning_1')) });
  h.set_click('#copy-gloss', copy_gloss);
  h.set_click('#gloss-keys-btn', () => { h.toggle_hide('#gloss-keys-wrap') });

  h.set_input('#query-text', function() {
    clearTimeout(TYPING_TIMEOUT);
    TYPING_TIMEOUT = setTimeout(search_handler, SEARCH_TIMER_SPEED);
  });

  window.addEventListener('dblclick', search_selection);
});

