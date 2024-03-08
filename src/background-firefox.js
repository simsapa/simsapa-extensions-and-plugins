const SIMSAPA_BASE_URL = "http://localhost:4848";
const HEARTBEAT_TIME_MS = 10000; // 10s

function simsapa_app_lookup(word) {
  const url = SIMSAPA_BASE_URL + "/lookup_window_query";
  const data = { query_text: word };

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(data),
  })
    .catch(error => console.error('Error:', error));
}

if (typeof browser !== "undefined") {
  console.log("Simsapa Firefox extention: background script loaded.");

  // Open the sidebar when the extension icon is clicked.
  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.open();
  });

  browser.runtime.onMessage.addListener(function (message) {
    browser.sidebarAction
           .isOpen({})
           .then((is_open) => {
             if (!is_open) {
               simsapa_app_lookup(message.query_text);
             }
           });
  });
}
