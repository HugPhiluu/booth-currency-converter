// Booth Currency Converter content script loaded

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
 * Sanitize a string for safe insertion as text content.
 * Only allows numbers, comma, dot, space, parentheses, and uppercase letters.
 * @param {string} str
 * @returns {string}
 */
function sanitizeText(str) {
  return String(str).replace(/[^\d.,\sA-Z\-()]/g, "");
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
      // Sanitize formatted and targetCurrency before inserting
      return `${match}|||BOOTH_CONVERSION|||${sanitizeText(formatted)} ${sanitizeText(targetCurrency)}`;
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
  try {
    const response = await browser.runtime.sendMessage({ type: "fetch-rate", targetCurrency });
    if (response && response.rate) {
      return response.rate;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
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


// Listen for messages from the background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "update-prices") {
    convertPrices();
  }
});

// Initial conversion
convertPrices();
