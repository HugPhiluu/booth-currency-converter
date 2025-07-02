const { zip } = require('zip-a-folder');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const BIN = 'bin';
const CHROME = path.join(BIN, 'chrome');
const FIREFOX = path.join(BIN, 'firefox');

// Updated paths for new folder structure
const INCLUDE = [
  { from: 'public/popup.html', to: 'popup.html' },
  { from: 'public/styles.css', to: 'styles.css' },
  { from: 'public/icons', to: 'icons' },
  { from: 'src/popup.js', to: 'popup.js' },
  { from: 'src/background.js', to: 'background.js' },
  { from: 'src/content.js', to: 'content.js' },
  { from: 'src/browser-polyfill.js', to: 'browser-polyfill.js' }
];

function clean(dir) {
  if (fs.existsSync(dir)) fse.removeSync(dir);
  if (!fs.existsSync(BIN)) fs.mkdirSync(BIN);
}

function copyFiles(target, manifestFile) {
  fse.mkdirpSync(target);
  INCLUDE.forEach(item => {
    if (fs.existsSync(item.from)) {
      fse.copySync(item.from, path.join(target, item.to));
    }
  });
  fse.copySync(manifestFile, path.join(target, 'manifest.json'));
}

async function build() {
  clean(CHROME);
  clean(FIREFOX);

  // Chrome build (MV3)
  copyFiles(CHROME, 'manifest.chrome.json');
  await zip(CHROME, path.join(BIN, 'chrome.zip'));

  // Firefox build (MV2)
  copyFiles(FIREFOX, 'manifest.firefox.json');
  await zip(FIREFOX, path.join(BIN, 'firefox.zip'));

  console.log('Build complete: bin/chrome.zip and bin/firefox.zip');
}

build();