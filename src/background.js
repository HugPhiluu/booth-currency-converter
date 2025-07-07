if (typeof importScripts === "function") {
  try { importScripts('browser-polyfill.js'); } catch (e) {}
}

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

// Handle keyboard shortcuts
browser.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-conversion") {
    // Get current setting
    const result = await browser.storage.local.get(["enabled"]);
    const currentEnabled = result.enabled !== false;
    
    // Toggle the setting
    await browser.storage.local.set({ enabled: !currentEnabled });
    
    // Send message to all content scripts to update
    const tabs = await browser.tabs.query({});
    tabs.forEach(tab => {
      if (tab.url && (tab.url.includes('booth.pm') || 
                      tab.url.includes('mercari.com') ||
                      tab.url.includes('yahoo.co.jp') ||
                      tab.url.includes('rakuten.co.jp') ||
                      tab.url.includes('amazon.co.jp'))) {
        browser.tabs.sendMessage(tab.id, { 
          type: "toggle-conversion", 
          enabled: !currentEnabled 
        }).catch(() => {
          // Content script might not be ready
        });
      }
    });
  }
});