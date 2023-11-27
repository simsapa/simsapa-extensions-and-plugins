// Open the sidebar when the extension icon is clicked.
browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.open();
});
