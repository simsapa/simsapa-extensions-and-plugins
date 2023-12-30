document.addEventListener('dblclick', function(_e) {
  const word = window.getSelection().toString();
  if (word) {
    browser.runtime.sendMessage({ query_text: word });
  }
});
