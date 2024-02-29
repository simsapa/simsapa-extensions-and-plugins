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

// When loaded in the Firefox extension.
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

let panel_is_open = false;

// When loaded in the Chrome extension.
if (typeof chrome !== "undefined" && chrome.hasOwnProperty('sidePanel')) {
  console.log("Simsapa Chrome extention: background script loaded.");

  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

  setInterval(() => {
    if (panel_is_open) {
      chrome.runtime.sendMessage("ping")
            .catch((_e) => {
              // console.error(e);
            });
    }
  }, HEARTBEAT_TIME_MS);

  chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === 'SimsapaSidePanel') {
      panel_is_open = true;

      port.onDisconnect.addListener(async () => {
        console.log("SimsapaSidePanel disconnect");
        panel_is_open = false;
      });
    }
  });

  chrome.runtime.onMessage.addListener(function (message) {
    if (message == "ping") {
      return;
    }

    if (!panel_is_open) {
      simsapa_app_lookup(message.query_text);
    }
  });
}
