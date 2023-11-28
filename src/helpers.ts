import * as clipboard from "clipboard-polyfill";

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

function set_clipboard_text(text: string): void {
  navigator.clipboard.writeText(text);
}

async function set_clipboard_html(html: string, text: string): Promise<void> {
  // ClipboardItem is not enabled in Firefox by default.
  // The clipboard-polyfill library adds the missing functionality.

  const item = new clipboard.ClipboardItem({
    "text/html": new Blob([html], { type: "text/html" }),
    "text/plain": new Blob([text], { type: "text/plain" }),
  });

  await clipboard.write([item]);
}

function is_numeric(str: any): boolean {
    // https://stackoverflow.com/a/175787
    if (typeof str != "string") return false;
    // @ts-ignore
    return !isNaN(str) && !isNaN(parseFloat(str));
}

export {
    toggle_hide,
    set_listener,
    set_click,
    set_input,
    set_clipboard_text,
    set_clipboard_html,
    is_numeric,
}
