import * as clipboard from "clipboard-polyfill";

const RE_ALL_BOOK_SUTTA_REF = /(?<!\/)\b(DN|MN|SN|AN|Pv|Vv|Vism|iti|kp|khp|snp|th|thag|thig|ud|uda|dhp)[ .]*(\d[\d\.:]*)\b/i;

function is_book_sutta_ref(ref: string): boolean {
    return RE_ALL_BOOK_SUTTA_REF.test(ref);
}

function toggle_hide(selector: string): void {
  let el = document.querySelector(selector);
  if (el) {
    el.classList.toggle('hide');
  } else {
    console.error("Cannot find: " + selector);
  }
}

function set_listener(selector: string,
                      type: any,
                      listener_fn: (this: HTMLElement, ev: MouseEvent) => any): void {
    let el = document.querySelector(selector);
    if (!el) {
        console.error("Cannot find: " + selector);
        return;
    }
    el.addEventListener(type, listener_fn);
}

function set_click(selector: string,
                   listener_fn: (this: HTMLElement, ev: MouseEvent) => any): void {
    set_listener(selector, 'click', listener_fn);
}

function set_input(selector: string,
                   listener_fn: (this: HTMLElement, ev: MouseEvent) => any): void {
    set_listener(selector, 'input', listener_fn);
}

function show_transient_message(text: string): void {
  const div = document.createElement('div');
  div.className = 'message';
  div.textContent = text;

  let el = document.getElementById('transient-messages');
  if (!el) {
    console.error("Cannot find: transient-messages");
    return;
  }

  el.appendChild(div);

  div.style.transition = 'opacity 1.5s ease-in-out';
  div.style.opacity = '1';

  // After 3 seconds, start fading out
  setTimeout(() => {
    div.style.opacity = '0';
  }, 1000);

  // After the transition ends, remove the div from the DOM
  div.addEventListener('transitionend', () => {
    div.remove();
  });
}

function set_clipboard_text(text: string): void {
  navigator.clipboard.writeText(text).then(
    () => { show_transient_message("Copied!"); },
    () => { show_transient_message("Failed to copy to clipboard"); },
  );
}

async function set_clipboard_html(html: string, text: string): Promise<void> {
  // ClipboardItem is not enabled in Firefox by default.
  // The clipboard-polyfill library adds the missing functionality.

  const item = new clipboard.ClipboardItem({
    "text/html": new Blob([html], { type: "text/html" }),
    "text/plain": new Blob([text], { type: "text/plain" }),
  });

  await clipboard.write([item]).then(
    () => { show_transient_message("Copied!"); },
    () => { show_transient_message("Failed to copy to clipboard"); },
  );
}

function is_numeric(str: any): boolean {
    // https://stackoverflow.com/a/175787
    if (typeof str != "string") return false;
    // @ts-ignore
    return !isNaN(str) && !isNaN(parseFloat(str));
}

function select_tab_elements(tab_div_selector: string,
                             controls_div_selector: string,
                             results_div_selector: string): void {
  let tabs = document.querySelectorAll(".tab");
  tabs.forEach(el => el.classList.remove("selected"));

  let tab_el = document.querySelector(tab_div_selector);
  tab_el.classList.add("selected");

  let controls = document.querySelectorAll(".controls");
  controls.forEach(el => el.classList.add("hide"));

  let active_controls = document.querySelector(controls_div_selector);
  active_controls.classList.remove("hide");

  let results = document.querySelectorAll(".results-wrap");
  results.forEach(el => el.classList.add("hide"));

  let active_results = document.querySelector(results_div_selector);
  active_results.classList.remove("hide");
}

function strip_html(text: string): string {
  text = text.replace(/<!doctype html>/gi, '');
  text = text.replace(/<head.*?<\/head>/gs, '');
  text = text.replace(/<style.*?<\/style>/gs, '');
  text = text.replace(/<script.*?<\/script>/gs, '');
  text = text.replace(/<!--.*?-->/gs, '');
  text = text.replace(/<\/?\w[^>]*>/g, '');

  text = text.replace(/ {2,}/g, ' ');

  return text;
}

export {
  toggle_hide,
  set_listener,
  set_click,
  set_input,
  show_transient_message,
  set_clipboard_text,
  set_clipboard_html,
  is_numeric,
  select_tab_elements,
  strip_html,
  is_book_sutta_ref,
}
