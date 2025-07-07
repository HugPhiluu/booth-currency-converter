# Japanese E-commerce Currency Converter

A browser extension that automatically converts JPY prices on Japanese shopping sites into your preferred currency with enhanced styling and features.  
Supports booth.pm, Mercari, Amazon JP, Yahoo Shopping, Rakuten, and more Japanese e-commerce sites.

---

## Features

- **Multi-site support** - Works on Booth, Mercari, Amazon JP, Yahoo Shopping, Rakuten, and other Japanese e-commerce sites
- **Enhanced price detection** - Recognizes various JPY formats (¥1000, 1,000円, 1000 yen, etc.)
- **21+ currencies supported** - EUR, USD, GBP, CHF, SEK, NOK, and many more built-in options
- **Custom currency support** - Enter any valid 3-letter ISO currency code
- **Visual enhancements** - Styled conversion displays with hover effects and click-to-copy
- **Toggle functionality** - Enable/disable conversions with a checkbox or keyboard shortcut (Ctrl+Shift+Y)
- **Dynamic content support** - Automatically detects and converts newly loaded prices
- **Number notation selection** - European (1.000,00) or US (1,000.00) style formatting
- **Performance optimized** - Debounced updates and mutation observer for dynamic content
- **Cross-browser compatibility** - Works with both Firefox (Manifest V2) and Chrome (Manifest V3)
- **Enhanced error handling** - Better warning messages with retry functionality
- **Live exchange rates** - Cached for 1 hour via [Frankfurter API](https://www.frankfurter.app/)
- **Accessible UI** - Keyboard navigation and screen reader support
- **Unit tested** - Comprehensive test coverage

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

This will package the extension into zip files in the `bin/` folder for both Chrome and Firefox:

```sh
npm run build
```

- Output: `bin/chrome.zip` (Chrome, Manifest V3), `bin/firefox.zip` (Firefox, Manifest V2)

### 4. Load as Unpacked Extension

#### Chrome

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `bin/chrome/` folder

#### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file from the `bin/firefox/` folder

---

## Usage

1. **Install and activate** the extension in your browser.
2. **Visit any supported Japanese e-commerce site** (Booth, Mercari, Amazon JP, etc.).
3. **Click the extension icon** to open the settings popup.
4. **Select your preferred currency** from the expanded list of 21+ options.
5. **Choose number notation** (European 1.000,00 or US 1,000.00 style).
6. **Enable/disable conversions** using the checkbox or press **Ctrl+Shift+Y** for quick toggle.
7. **Click Save** to apply settings and see prices converted automatically.
8. **Hover over converted prices** to see enhanced styling and click to copy values.
9. **Use Refresh Rates** to update exchange rates manually.

### Keyboard Shortcuts
- **Ctrl+Shift+Y** - Toggle currency conversion on/off
2. Select your preferred currency and number notation in the popup.
3. To use a custom currency, select "Other..." in the dropdown, enter a valid 3-letter currency code (e.g., CHF), and click "Save". Your choice will be remembered and shown the next time you open the popup.
4. Click "Save" to apply settings.
5. Click "Refresh Rates" to manually update exchange rates.
6. All JPY prices on booth.pm will be converted automatically.

---

## Development

- **Source files:** All code is in the `src/` and `public/` directories.
- **Build script:** [`build.js`](build.js) copies only the necessary files to `bin/chrome/` and `bin/firefox/` and zips them.
- **Unit tests:** Run with `npm test` (see [`test/utils.test.js`](test/utils.test.js)).
- **Extension files included in build:**  
  - `manifest.json` (from `manifest.chrome.json` or `manifest.firefox.json`)
  - `popup.html`, `popup.js`, `styles.css`
  - `background.js`, `content.js`, `browser-polyfill.js`
  - `icons/` (icon assets)

---

## File Structure

```
booth-currency-converter/
├── build.js
├── LICENSE
├── manifest.chrome.json
├── manifest.firefox.json
├── package.json
├── README.md
├── bin/
│   ├── chrome/
│   ├── chrome.zip
│   ├── firefox/
│   └── firefox.zip
├── public/
│   ├── popup.html
│   ├── styles.css
│   └── icons/
│       └── icon.png
├── src/
│   ├── background.js
│   ├── browser-polyfill.js
│   ├── content.js
│   ├── popup.js
│   └── utils.js
├── test/
│   └── utils.test.js
└── ...
```

---

## Customization

- **Add more currencies:**  
  Edit the `<select>` in [`public/popup.html`](public/popup.html) or allow more codes in the popup logic in [`src/popup.js`](src/popup.js).
- **Change icons:**  
  Replace files in the `public/icons/` folder and update the manifests if needed.
- **API endpoint:**  
  The extension uses [Frankfurter API](https://www.frankfurter.app/) for exchange rates. You can change the endpoint in [`src/background.js`](src/background.js).

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