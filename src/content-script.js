document.addEventListener('dblclick', function(_e) {
  const word = window.getSelection().toString();
  if (word) {
    // Firefox
    if (typeof browser !== "undefined") {
      browser.runtime.sendMessage({ query_text: word });
    }

    // Chrome
    if (typeof chrome !== "undefined") {
      chrome.runtime.sendMessage({ query_text: word });
    }
  }
});
