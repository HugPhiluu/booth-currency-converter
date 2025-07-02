document.addEventListener("DOMContentLoaded", async () => {
  const currency = document.getElementById("currency");
  const notation = document.getElementById("notation");
  const save = document.getElementById("save");

  const result = await browser.storage.local.get(["targetCurrency", "notation"]);
  currency.value = result.targetCurrency || "EUR";
  notation.value = result.notation || "comma";

  save.onclick = () => {
    browser.storage.local.set({
      targetCurrency: currency.value,
      notation: notation.value
    });
    window.close();
  };
});