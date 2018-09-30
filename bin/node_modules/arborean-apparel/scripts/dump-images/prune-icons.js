const fs = require('fs');
const path = require('path');
const itemData = require('./items.json');

const basedir = path.join(__dirname, 'icons/equipment');
const usedir = path.join(basedir, 'used');
const unused = path.join(basedir, 'unused');

if (!fs.existsSync(usedir)) fs.mkdirSync(usedir);
if (!fs.existsSync(unused)) fs.mkdirSync(unused);

process.chdir(basedir);

const lowercase = new Map();

for (const id of Object.keys(itemData.items)) {
  const icon = itemData.items[id].icon;
  const fn = icon.slice('Icon_Equipments/'.length) + '.png';

  if (lowercase.has(fn.toLowerCase())) console.warn('!!!');
  lowercase.set(fn.toLowerCase(), fn);
}

for (const fn of fs.readdirSync('.')) {
  if (!fs.statSync(fn).isFile()) continue;
  if (lowercase.has(fn.toLowerCase())) {
    fs.renameSync(fn, path.join(usedir, lowercase.get(fn.toLowerCase())));
  } else {
    fs.renameSync(fn, path.join(unused, fn));
  }
}
