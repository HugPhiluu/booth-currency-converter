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

module.exports = { formatCurrency };