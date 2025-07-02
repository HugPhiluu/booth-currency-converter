document.addEventListener("DOMContentLoaded", async () => {
  const currency = document.getElementById("currency");
  const notation = document.getElementById("notation");
  const save = document.getElementById("save");
  const feedback = document.getElementById("feedback");

  const result = await browser.storage.local.get(["targetCurrency", "notation"]);
  currency.value = result.targetCurrency || "EUR";
  notation.value = result.notation || "comma";

  save.onclick = async () => {
    feedback.textContent = ""; // Clear previous feedback
    try {
      await browser.storage.local.set({
        targetCurrency: currency.value,
        notation: notation.value
      });
      feedback.style.color = "green";
      feedback.textContent = "Settings saved!";
      setTimeout(() => window.close(), 700);
    } catch (e) {
      feedback.style.color = "red";
      feedback.textContent = "Failed to save settings.";
    }
  };
});