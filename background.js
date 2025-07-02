importScripts('browser-polyfill.js');

let lastRates = {};
let lastUpdated = {};

async function fetchAndCacheRate(targetCurrency) {
  const res = await fetch(`https://api.frankfurter.app/latest?from=JPY&to=${targetCurrency}`);
  const data = await res.json();
  if (data && data.rates && data.rates[targetCurrency]) {
    lastRates[targetCurrency] = data.rates[targetCurrency];
    lastUpdated[targetCurrency] = Date.now();
    await browser.storage.local.set({ [`lastUpdated_${targetCurrency}`]: lastUpdated[targetCurrency] });
    return data.rates[targetCurrency];
  }
  throw new Error("No rate");
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "fetch-rate") {
    // Use cached rate if less than 1 hour old
    const now = Date.now();
    const cached = lastRates[message.targetCurrency];
    const updated = lastUpdated[message.targetCurrency];
    if (cached && updated && now - updated < 60 * 60 * 1000) {
      return Promise.resolve({ rate: cached });
    }
    return fetchAndCacheRate(message.targetCurrency)
      .then(rate => ({ rate }))
      .catch(() => ({ rate: null }));
  }
  if (message.type === "force-refresh-rate") {
    return fetchAndCacheRate(message.targetCurrency)
      .then(rate => ({ rate }))
      .catch(() => ({ rate: null }));
  }
});