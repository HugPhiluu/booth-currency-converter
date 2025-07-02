importScripts('browser-polyfill.js');

// Use browser.runtime.onMessage for cross-browser compatibility
browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "fetch-rate") {
    return fetch(`https://api.frankfurter.app/latest?from=JPY&to=${message.targetCurrency}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates[message.targetCurrency]) {
          return { rate: data.rates[message.targetCurrency] };
        } else {
          console.error("Exchange API error or missing rate", data);
          return { rate: null };
        }
      })
      .catch(e => {
        console.error("Fetch failed in background.js", e);
        return { rate: null };
      });
  }
});