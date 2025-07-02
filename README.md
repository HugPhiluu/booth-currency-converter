# booth-currency-converter

A browser extension that automatically converts JPY prices on [booth.pm](https://booth.pm) into your preferred currency.  
Choose your target currency in the extension popup and instantly see all booth.pm prices updated in real time.

---

## Features

- **Automatic JPY price conversion** on booth.pm to your selected currency
- **Multiple currencies supported** (EUR, USD, GBP, AUD, CAD, CNY, KRW, and custom codes)
- **Number notation selection** (European or US style)
- **Works with both Firefox and Chrome** (Manifest V3)
- **No user tracking or analytics**
- **Live exchange rates** (via [Frankfurter API](https://www.frankfurter.app/))
- **Settings popup** for currency and notation
- **Manual refresh** of exchange rates
- **Accessible UI** and keyboard navigation
- **Unit tested** currency formatting

---

## Installation

### 1. Clone or Download

```sh
git clone https://github.com/HugPhiluu/booth-currency-converter.git
cd booth-currency-converter
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Build the Extension

This will package the extension into a zip file in the `bin/` folder:

```sh
npm run build
```

- Output: `bin/build.zip` (ready for upload or distribution)

### 4. Load as Unpacked Extension

#### Chrome

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project folder (or extract `bin/build.zip` and select the folder)

#### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file from the project folder (or from the extracted `bin/dist`)

---

## Usage

1. Click the extension icon while browsing booth.pm.
2. Select your preferred currency and number notation in the popup.
3. Optionally, enter a custom 3-letter currency code.
4. Click "Save" to apply settings.
5. Click "Refresh Rates" to manually update exchange rates.
6. All JPY prices on booth.pm will be converted automatically.

---

## Development

- **Source files:** All code is in the root directory.
- **Build script:** [`build.js`](build.js) copies only the necessary files to `bin/dist` and zips them as `bin/build.zip`.
- **Unit tests:** Run with `npm test` (see [`utils.test.js`](utils.test.js)).
- **Extension files included in build:**  
  - `manifest.json`
  - `popup.html`, `popup.js`, `styles.css`
  - `background.js`, `content.js`, `browser-polyfill.js`
  - `icons/` (icon assets)

---

## File Structure

```
booth-currency-converter/
├── background.js
├── build.js
├── content.js
├── icons/
├── manifest.json
├── package.json
├── popup.html
├── popup.js
├── styles.css
├── utils.js
├── utils.test.js
├── bin/
│   └── build.zip
└── ...
```

---

## Customization

- **Add more currencies:**  
  Edit the `<select>` in [`popup.html`](popup.html) or allow more codes in the popup logic.
- **Change icons:**  
  Replace files in the `icons/` folder and update `manifest.json` if needed.
- **API endpoint:**  
  The extension uses [Frankfurter API](https://www.frankfurter.app/) for exchange rates. You can change the endpoint in [`background.js`](background.js).

---

## Troubleshooting

- **Exchange rate not updating?**  
  Click "Refresh Rates" in the popup or check your internet connection.
- **Extension not loading?**  
  Make sure you select the correct folder containing `manifest.json` when loading as unpacked.
- **Build issues?**  
  Ensure Node.js and npm are installed. Run `npm install` before building.

---

## License

MIT License  
See [`LICENSE`](LICENSE) for details.

---

## Contributing

Pull requests and issues are welcome!  
See [GitHub Issues](https://github.com/HugPhiluu/booth-currency-converter/issues).

---

## Building for Chrome and Firefox

- To build for **Chrome** (Manifest V3):  
  Output will be in `bin/chrome/` and `bin/chrome.zip`.

- To build for **Firefox** (Manifest V2):  
  Output will be in `bin/firefox/` and `bin/firefox.zip`.

```sh
npm run build
```

Then load the appropriate folder as an unpacked extension in your browser.
