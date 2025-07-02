console.log("Booth Currency Converter content script loaded");

/**
 * Get user settings from browser storage.
 * @returns {Promise<{targetCurrency: string, notation: string}>}
 */
async function getSettings() {
  const result = await browser.storage.local.get(["targetCurrency", "notation"]);
  return {
    targetCurrency: result.targetCurrency || "EUR",
    notation: result.notation || "comma"
  };
}

/**
 * Format a number as currency according to the selected notation.
 * @param {number} amount
 * @param {string} notation
 * @returns {string}
 */
function formatCurrency(amount, notation) {
  if (notation === "dot") {
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    // "comma": European style
    return amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

/**
 * Remove all previously added conversion spans from the DOM.
 */
function removePreviousConversions() {
  document.querySelectorAll('span.booth-currency-converted').forEach(span => {
    span.parentNode.removeChild(span);
  });
}

/**
 * Recursively replace text nodes containing JPY prices with converted values.
 * @param {Node} node
 * @param {number} rate
 * @param {string} targetCurrency
 * @param {string} notation
 */
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

/**
 * Fetch the exchange rate from background.js using messaging.
 * @param {string} targetCurrency
 * @returns {Promise<number|null>}
 */
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

/**
 * Show a warning banner if the exchange rate cannot be fetched.
 */
function showExchangeRateWarning() {
  if (document.getElementById('booth-currency-warning')) return;
  const div = document.createElement('div');
  div.id = 'booth-currency-warning';
  div.textContent = "Currency Converter: Failed to fetch exchange rate.";
  div.style.cssText = "background:#ffe0e0;color:#900;padding:8px;text-align:center;font-weight:bold;position:fixed;top:0;left:0;width:100%;z-index:9999;";
  document.body.prepend(div);
  setTimeout(() => {
    if (div.parentNode) div.parentNode.removeChild(div);
  }, 5000);
}

/**
 * Main function to convert all JPY prices on the page.
 */
async function convertPrices() {
  removePreviousConversions();
  const { targetCurrency, notation } = await getSettings();
  const rate = await fetchRate(targetCurrency);
  if (!rate) {
    showExchangeRateWarning();
    console.warn("No exchange rate, aborting conversion");
    return;
  }
  replaceTextNodes(document.body, rate, targetCurrency, notation);
}

/**
 * Debounce utility to limit how often a function can run.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Debounced version for use with MutationObserver and storage changes
const debouncedConvertPrices = debounce(convertPrices, 500);

// Listen for storage changes (settings)
browser.storage.onChanged.addListener(debouncedConvertPrices);

// Initial conversion
convertPrices();

// MutationObserver to handle dynamic content changes
const observer = new MutationObserver(mutations => {
  // Only run if added/removed nodes or text changes
  for (const mutation of mutations) {
    if (
      mutation.type === "childList" && (mutation.addedNodes.length || mutation.removedNodes.length)
    ) {
      debouncedConvertPrices();
      break;
    }
    if (mutation.type === "characterData") {
      debouncedConvertPrices();
      break;
    }
  }
});

// Start observing the body for changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});