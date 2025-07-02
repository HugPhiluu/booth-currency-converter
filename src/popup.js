document.addEventListener("DOMContentLoaded", async () => {
  const currency = document.getElementById("currency");
  const notation = document.getElementById("notation");
  const save = document.getElementById("save");
  const refresh = document.getElementById("refresh");
  const feedback = document.getElementById("feedback");

  const result = await browser.storage.local.get(["targetCurrency", "notation"]);
  currency.value = result.targetCurrency || "EUR";
  notation.value = result.notation || "comma";

  currency.onchange = () => {
    const custom = document.getElementById("custom-currency");
    if (currency.value === "OTHER") {
      custom.style.display = "";
      custom.focus();
    } else {
      custom.style.display = "none";
    }
  };

  save.onclick = async () => {
    feedback.textContent = "";
    let selectedCurrency = currency.value;
    if (selectedCurrency === "OTHER") {
      selectedCurrency = document.getElementById("custom-currency").value.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(selectedCurrency)) {
        feedback.style.color = "red";
        feedback.textContent = "Enter a valid 3-letter currency code.";
        return;
      }
    }
    try {
      await browser.storage.local.set({
        targetCurrency: selectedCurrency,
        notation: notation.value
      });
      feedback.style.color = "green";
      feedback.textContent = "Settings saved!";
    } catch (e) {
      feedback.style.color = "red";
      feedback.textContent = "Failed to save settings.";
    }
  };

  refresh.onclick = async () => {
    feedback.textContent = ""; // Clear previous feedback
    try {
      await browser.runtime.sendMessage({ type: "force-refresh-rate", targetCurrency: currency.value });
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
      selectedCurrency = document.getElementById("custom-currency").value.trim().toUpperCase();
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
  document.getElementById("custom-currency").addEventListener("input", showLastUpdated);
  showLastUpdated();
});