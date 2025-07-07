// Booth Currency Converter content script loaded

/**
 * Get user settings from browser storage.
 * @returns {Promise<{targetCurrency: string, notation: string, enabled: boolean}>}
 */
async function getSettings() {
  const result = await browser.storage.local.get(["targetCurrency", "notation", "enabled"]);
  return {
    targetCurrency: result.targetCurrency || "EUR",
    notation: result.notation || "comma",
    enabled: result.enabled !== false // Default to enabled
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
  // Enhanced regex to match various JPY price formats
  const priceRegex = /([¥￥]?\s*[0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?\s*(?:JPY|円|yen)?\b)|([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?\s*(?:JPY|円|yen)\b)/gi;
  
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
    const newText = node.textContent.replace(priceRegex, (match) => {
      // Extract numeric value from various formats
      let numStr = match.replace(/[¥￥円yen]/gi, '').replace(/JPY/gi, '').trim();
      // Handle both comma and space as thousand separators
      numStr = numStr.replace(/[,\s]/g, '');
      const num = parseFloat(numStr);
      
      if (isNaN(num) || num < 1 || !rate) return match;
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
        span.style.cssText = 'color: #007acc; font-weight: 500; background: rgba(0, 122, 204, 0.1); padding: 1px 4px; border-radius: 3px; margin-left: 3px; font-size: 0.9em; transition: all 0.2s ease;';
        span.title = 'Converted price - click to copy';
        
        // Add hover effect and click to copy functionality
        span.addEventListener('mouseenter', () => {
          span.style.background = 'rgba(0, 122, 204, 0.2)';
          span.style.transform = 'scale(1.05)';
        });
        span.addEventListener('mouseleave', () => {
          span.style.background = 'rgba(0, 122, 204, 0.1)';
          span.style.transform = 'scale(1)';
        });
        span.addEventListener('click', () => {
          navigator.clipboard.writeText(parts[i]).then(() => {
            const originalText = span.textContent;
            span.textContent = ' (Copied!)';
            span.style.color = '#28a745';
            setTimeout(() => {
              span.textContent = originalText;
              span.style.color = '#007acc';
            }, 1000);
          }).catch(() => {
            // Fallback for older browsers
            console.log('Copy to clipboard not available');
          });
        });
        
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
  div.innerHTML = `
    <span>⚠️ Currency Converter: Failed to fetch exchange rate.</span>
    <button id="retry-rate" style="margin-left: 12px; padding: 4px 8px; background: #fff; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;">Retry</button>
    <button id="close-warning" style="margin-left: 8px; padding: 4px 8px; background: #fff; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;">×</button>
  `;
  div.style.cssText = "background:#ffe0e0;color:#900;padding:8px 12px;text-align:center;font-weight:bold;position:fixed;top:0;left:0;width:100%;z-index:9999;box-shadow:0 2px 4px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;";
  
  document.body.prepend(div);
  
  // Add event listeners
  document.getElementById('retry-rate').addEventListener('click', () => {
    div.remove();
    convertPrices();
  });
  
  document.getElementById('close-warning').addEventListener('click', () => {
    div.remove();
  });
  
  setTimeout(() => {
    if (div.parentNode) div.parentNode.removeChild(div);
  }, 10000); // Longer timeout for better UX
}

/**
 * Main function to convert all JPY prices on the page.
 */
async function convertPrices() {
  removePreviousConversions(); 
  const { targetCurrency, notation, enabled } = await getSettings();
  
  // Exit early if conversions are disabled
  if (!enabled) {
    return;
  }
  
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
  } else if (message && message.type === "toggle-conversion") {
    // Handle keyboard shortcut toggle
    if (message.enabled) {
      convertPrices();
    } else {
      removePreviousConversions();
    }
    
    // Show a brief notification about the toggle
    showToggleNotification(message.enabled);
  }
});

/**
 * Show a brief notification when conversion is toggled via keyboard shortcut
 */
function showToggleNotification(enabled) {
  // Remove existing notification if any
  const existing = document.getElementById('booth-toggle-notification');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'booth-toggle-notification';
  div.textContent = enabled ? "Currency conversion enabled" : "Currency conversion disabled";
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${enabled ? '#28a745' : '#6c757d'};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  
  // Add CSS animation
  if (!document.getElementById('booth-toggle-animation')) {
    const style = document.createElement('style');
    style.id = 'booth-toggle-animation';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(div);
  setTimeout(() => {
    if (div.parentNode) div.parentNode.removeChild(div);
  }, 2000);
}

// Debounced conversion function for mutation observer
const debouncedConvertPrices = debounce(convertPrices, 500);

// Mutation observer to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
  let shouldUpdate = false;
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Check if any text nodes were added that might contain prices
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE || 
            (node.nodeType === Node.ELEMENT_NODE && node.textContent && node.textContent.includes('JPY'))) {
          shouldUpdate = true;
        }
      });
    }
  });
  
  if (shouldUpdate) {
    debouncedConvertPrices();
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial conversion
convertPrices();
