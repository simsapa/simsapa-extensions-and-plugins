// When loaded in the Firefox extension.
if (typeof browser !== "undefined") {
  // Open the sidebar when the extension icon is clicked.
  browser.browserAction.onClicked.addListener(() => {
    browser.sidebarAction.open();
  });
}

// When loaded in the Chrome extension.
if (typeof chrome !== "undefined") {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
}
