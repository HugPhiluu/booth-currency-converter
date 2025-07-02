const { zip } = require('zip-a-folder');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const BIN = 'bin';
const CHROME = path.join(BIN, 'chrome');
const FIREFOX = path.join(BIN, 'firefox');

const INCLUDE = [
  'popup.html',
  'popup.js',
  'styles.css',
  'browser-polyfill.js',
  'background.js',
  'content.js',
  'icons'
];

function clean(dir) {
  if (fs.existsSync(dir)) fse.removeSync(dir);
  if (!fs.existsSync(BIN)) fs.mkdirSync(BIN);
}

function copyFiles(target, manifestFile) {
  fse.mkdirpSync(target);
  INCLUDE.forEach(item => {
    if (fs.existsSync(item)) {
      fse.copySync(item, path.join(target, item));
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