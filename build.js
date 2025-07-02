const { zip } = require('zip-a-folder');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const BIN = 'bin';
const DIST = path.join(BIN, 'dist');
const ZIP = path.join(BIN, 'build.zip');

// Clean up previous build
if (fs.existsSync(DIST)) fse.removeSync(DIST);
if (fs.existsSync(ZIP)) fs.unlinkSync(ZIP);
if (!fs.existsSync(BIN)) fs.mkdirSync(BIN);

// List of files/folders to include in the build
const INCLUDE = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'styles.css',
  'browser-polyfill.js',
  'background.js',
  'icons', // folder, if you have icons
  // add more files/folders as needed
];

// Copy each file/folder to dist
INCLUDE.forEach(item => {
  if (fs.existsSync(item)) {
    fse.copySync(item, path.join(DIST, item));
  }
});

// Zip the dist folder into bin/build.zip
zip(DIST, ZIP).then(() => {
  console.log('Extension packaged as bin/build.zip');
  fse.removeSync(DIST); // Optional: clean up dist folder
});