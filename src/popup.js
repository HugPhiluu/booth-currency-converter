document.addEventListener("DOMContentLoaded", async () => {
  const currency = document.getElementById("currency");
  const notation = document.getElementById("notation");
  const save = document.getElementById("save");
  const refresh = document.getElementById("refresh");
  const feedback = document.getElementById("feedback");
  const custom = document.getElementById("custom-currency");
  const enabled = document.getElementById("enabled");

  // List of built-in currency codes
  const builtIn = ["EUR", "USD", "GBP", "AUD", "CAD", "CNY", "KRW", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "MXN", "BRL", "INR", "SGD", "HKD", "TWD", "THB"];

  // Load settings
  const result = await browser.storage.local.get(["targetCurrency", "notation", "customCurrency", "enabled"]);
  let selectedCurrency = result.targetCurrency || "EUR";
  let customCurrency = result.customCurrency || "";
  enabled.checked = result.enabled !== false; // Default to enabled

  // If not built-in, set to OTHER and fill textbox
  if (!builtIn.includes(selectedCurrency)) {
    currency.value = "OTHER";
    custom.value = selectedCurrency;
    custom.style.display = "";
  } else {
    currency.value = selectedCurrency;
    custom.style.display = "none";
    custom.value = "";
  }
  notation.value = result.notation || "comma";

  currency.onchange = () => {
    if (currency.value === "OTHER") {
      custom.style.display = "";
      custom.focus();
      if (custom.value === "") {
        // If previously saved, restore
        custom.value = customCurrency;
      }
    } else {
      custom.style.display = "none";
      custom.value = "";
    }
  };

  save.onclick = async () => {
    feedback.textContent = "";
    let selectedCurrency = currency.value;
    let customCurrency = "";
    if (selectedCurrency === "OTHER") {
      customCurrency = custom.value.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(customCurrency)) {
        feedback.style.color = "red";
        feedback.textContent = "Enter a valid 3-letter currency code.";
        return;
      }
      selectedCurrency = customCurrency;
    }
    try {
      await browser.storage.local.set({
        targetCurrency: selectedCurrency,
        notation: notation.value,
        customCurrency: customCurrency, // Always save, even if empty
        enabled: enabled.checked
      });
      feedback.style.color = "green";
      feedback.textContent = "Settings saved!";

      // Send message to content script to update prices
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        browser.tabs.sendMessage(tab.id, { type: "update-prices" }).catch(() => {
          console.warn("No content script found in this tab.");
        });
      }
    } catch (e) {
      feedback.style.color = "red";
      feedback.textContent = "Failed to save settings.";
    }
  };

  refresh.onclick = async () => {
    feedback.textContent = ""; // Clear previous feedback
    try {
      let selectedCurrency = currency.value;
      if (selectedCurrency === "OTHER") {
        selectedCurrency = custom.value.trim().toUpperCase();
      }
      await browser.runtime.sendMessage({ type: "force-refresh-rate", targetCurrency: selectedCurrency });
      feedback.style.color = "green";
      feedback.textContent = "Exchange rate refreshed!";
    } catch (e) {
      feedback.style.color = "red";
      feedback.textContent = "Failed to refresh rate.";
    }
  };

  async function showLastUpdated() {
    let selectedCurrency = currency.value;
    if (selectedCurrency === "OTHER") {
      selectedCurrency = custom.value.trim().toUpperCase();
    }
    const key = `lastUpdated_${selectedCurrency}`;
    const result = await browser.storage.local.get([key]);
    const last = result[key];
    const info = document.getElementById("last-updated");
    if (last) {
      const d = new Date(last);
      info.textContent = `Last updated: ${d.toLocaleString()}`;
    } else {
      info.textContent = "No recent rate update.";
    }
  }

  currency.addEventListener("change", showLastUpdated);
  custom.addEventListener("input", showLastUpdated);
  enabled.addEventListener("change", updateConversionStatus);
  showLastUpdated();
  updateConversionStatus();
  
  function updateConversionStatus() {
    const statusDiv = document.getElementById("conversion-status");
    if (enabled.checked) {
      statusDiv.textContent = "✓ Conversion active";
      statusDiv.style.backgroundColor = "#d4edda";
      statusDiv.style.color = "#155724";
      statusDiv.style.border = "1px solid #c3e6cb";
    } else {
      statusDiv.textContent = "✗ Conversion disabled";
      statusDiv.style.backgroundColor = "#f8d7da";
      statusDiv.style.color = "#721c24";
      statusDiv.style.border = "1px solid #f5c6cb";
    }
  }
});