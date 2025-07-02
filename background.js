browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === "fetch-rate") {
    fetch(`https://api.frankfurter.app/latest?from=JPY&to=${message.targetCurrency}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates[message.targetCurrency]) {
          sendResponse({ rate: data.rates[message.targetCurrency] });
        } else {
          console.error("Exchange API error or missing rate", data);
          sendResponse({ rate: null });
        }
      })
      .catch(e => {
        console.error("Fetch failed in background.js", e);
        sendResponse({ rate: null });
      });
    return true; // Needed for async sendResponse in Firefox
  }
});