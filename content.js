console.log("Booth Currency Converter content script loaded");

async function getSettings() {
  const result = await browser.storage.local.get(["targetCurrency", "notation"]);
  return {
    targetCurrency: result.targetCurrency || "EUR",
    notation: result.notation || "comma"
  };
}

function formatCurrency(amount, notation) {
  if (notation === "dot") {
    return amount.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
  } else {
    // "comma": European style
    return amount.toLocaleString("de-DE", {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }
}

// Remove all previously added conversion spans
function removePreviousConversions() {
  document.querySelectorAll('span.booth-currency-converted').forEach(span => {
    span.parentNode.removeChild(span);
  });
}

function replaceTextNodes(node, rate, targetCurrency, notation) {
  const priceRegex = /([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*JPY\b/g;
  if (node.nodeType === Node.TEXT_NODE) {
    // Prevent converting if parent already contains a conversion span
    if (
      node.parentNode &&
      node.parentNode.querySelector &&
      node.parentNode.querySelector('.booth-currency-converted')
    ) {
      return;
    }

    let replaced = false;
    const newText = node.textContent.replace(priceRegex, (match, amount) => {
      const num = parseFloat(amount.replace(/,/g, ""));
      if (isNaN(num) || !rate) return match;
      const converted = num * rate;
      const formatted = formatCurrency(converted, notation);
      replaced = true;
      // Use a marker to later insert a span
      return `${match}|||BOOTH_CONVERSION|||${formatted} ${targetCurrency}`;
    });

    if (replaced) {
      // Split by marker and insert span for conversion
      const parts = newText.split('|||BOOTH_CONVERSION|||');
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode(parts[0]));
      for (let i = 1; i < parts.length; i++) {
        const span = document.createElement('span');
        span.className = 'booth-currency-converted';
        span.textContent = ` (${parts[i]})`;
        frag.appendChild(span);
        if (parts[i + 1]) {
          frag.appendChild(document.createTextNode(parts[i + 1]));
        }
      }
      node.parentNode.replaceChild(frag, node);
    }
  } else if (
    node.nodeType === Node.ELEMENT_NODE &&
    node.childNodes &&
    !["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME"].includes(node.tagName)
  ) {
    // Use Array.from to avoid live collection issues
    Array.from(node.childNodes).forEach(child => replaceTextNodes(child, rate, targetCurrency, notation));
  }
}

// Fetch the exchange rate from background.js using messaging
async function fetchRate(targetCurrency) {
  return new Promise((resolve) => {
    browser.runtime.sendMessage({ type: "fetch-rate", targetCurrency }, response => {
      if (response && response.rate) {
        console.log("Fetched rate:", response.rate);
        resolve(response.rate);
      } else {
        console.warn("No rate received from background:", response);
        resolve(null);
      }
    });
  });
}

async function convertPrices() {
  // Remove any previous conversions before running new ones
  removePreviousConversions();
  const { targetCurrency, notation } = await getSettings();
  const rate = await fetchRate(targetCurrency);
  if (!rate) {
    console.warn("No exchange rate, aborting conversion");
    return;
  }
  replaceTextNodes(document.body, rate, targetCurrency, notation);
}

browser.storage.onChanged.addListener(convertPrices);

convertPrices();