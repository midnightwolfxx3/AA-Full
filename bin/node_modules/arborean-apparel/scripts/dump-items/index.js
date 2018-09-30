const fs = require('fs');
const path = require('path');
const util = require('util');

let items = {};
const duplicates = {};

const RACES = ['human', 'highelf', 'aman', 'castanic', 'popori', 'baraka'];
const CLASSES = {
  name: ['warrior', 'lancer', 'slayer', 'berserker', 'sorcerer', 'archer', 'priest', 'mystic', 'reaper', 'gunner', 'brawler', 'ninja', 'valkyrie'],
  id: ['WARRIOR', 'LANCER', 'SLAYER', 'BERSERKER', 'SORCERER', 'ARCHER', 'PRIEST', 'ELEMENTALIST', 'SOULLESS', 'ENGINEER', 'FIGHTER', 'ASSASSIN', 'GLAIVER'],
  weapon: ['dual', 'lance', 'twohand', 'axe', 'circle', 'bow', 'staff', 'rod', 'chain', 'blaster', 'gauntlet', 'shuriken', 'glaive'],
};

const basedir = path.join(__dirname, '../../data/json');

/************************
 * PHASE 1: PARSE & FIX *
 * **********************/
{ // read item data
  function* readdirSync(dirname) {
    const dir = path.join(basedir, dirname);
    for (const fn of fs.readdirSync(dir)) {
      yield JSON.parse(fs.readFileSync(path.join(dir, fn), 'utf8'));
    }
  }

  for (const data of readdirSync('ItemData')) {
    if (!data['Item']) continue;

    for (const item of data['Item']) {
      // ensure unique id
      if (items[item.id]) {
        console.warn('---');
        console.warn('matching ID:');
        console.warn(items[item.id]);
        console.warn(item);
      }

      // ensure categorized
      if (!item.category) continue;

      // ensure required race also has required gender
      if (item.requiredRace && !item.requiredGender) {
        if (item.requiredRace === 'baraka') {
          item.requiredGender = 'male';
        } else {
          console.warn('---');
          console.warn('requires race but not gender:');
          console.warn(item);
        }
      }

      // parse fields
      const gender = item.requiredGender
        ? +(item.requiredGender === 'female')
        : false;

      const races = item.requiredRace
        ? item.requiredRace.split(';').map(r => gender + 2 * RACES.indexOf(r.toLowerCase()))
        : false;

      const classes = item.requiredClass
        ? item.requiredClass.split(';').map(c => CLASSES.id.indexOf(c.toUpperCase()))
        : false;

      //  ensure category matches restrictions
      let category = item.category.toLowerCase();
      let style = false;
      if (category.startsWith('style_')) {
        category = category.slice(6);
        if(category === 'foot_print') {
          category='effect'
          item.linkLookInfoId = item.icon
        }
        style = true;
      } else if (category.startsWith('accessory')) {
        category = category.slice(9);
      }

      const type = CLASSES.weapon.indexOf(item.category);
      if (type !== -1) {
        if (classes.indexOf(type) < 0) {
          console.warn('---');
          console.warn('mismatched category and restriction:');
          console.warn(item);
          if (classes.length === 1) {
            category = CLASSES.weapon[classes[0]];
            console.warn('correcting to:', category);
          }
        }
      }

      items[item.id] = {
        id: item.id,
        icon: item.icon.replace(/\./g, '/'),
        rarity: item.rareGrade,
        name: `[#${item.id}]`,
        tooltip: '',
        races: races,
        classes: classes,
        dyeable: item.changeColorEnable,
        nameable: false,
        extra: {
          category: category,
          style: style,
          accessoryColor: item.accessoryColorId,
          equipId: item.linkEquipmentId,
          lookId: item.linkLookInfoId,
          obtainable: item.obtainable,
          tempTime: item.periodInMinute,
          tradable: item.tradable,
        },
      };
    }
  }

  for (const data of readdirSync('StrSheet_Item')) {
    if (!data['String']) continue;

    for (const item of data['String']) {
      const it = items[item.id];
      if (!it) continue;
      if (item.string) it.name = item.string;
      if (item.toolTip) it.tooltip = item.toolTip;
    }
  }

  {
    const data = JSON.parse(fs.readFileSync(path.join(basedir, 'CustomExItem.json'), 'utf8'));
    if (data['ItemData'] && data['ItemData'][0] && data['ItemData'][0]['Item']) {
      for (const item of data['ItemData'][0]['Item']) {
        items[item.id].nameable = true;
      }
    }
  }
}

{
  const equipment = new Map();
  for (const item of JSON.parse(fs.readFileSync(path.join(basedir, 'EquipmentData.json'), 'utf8'))['Equipment']) {
    equipment.set(item.equipmentId, item.maxAtk || item.def);
  }

  const map = new Map();
  const items2 = {};

  for (const id of Object.keys(items)) {
    const item = items[id];
    const string = item.name;
    const { icon, races, classes, tooltip } = item;
    const { accessoryColor, lookId, obtainable, tempTime, tradable } = item.extra;
    if (!lookId) continue;

    const name = JSON.stringify([lookId, accessoryColor, races, classes]);
    if (!map.has(name)) map.set(name, []);
    const list = map.get(name);

    const score1 = (() => {
      if (/\[#\d+\]/.test(string) || string === '[TBU]') return -3;
      if (/[^\x20-\x7F]/.test(string)) return -2;
      if (string === 'Discontinued Template' || string.indexOf('Winter Update') !== -1 || string.indexOf('_') !== -1) return -1;
      return 0;
    })();
    const score2 = (() => {
      if (tempTime > -1 || tooltip.indexOf('Honorific') !== -1) return -0.4;
      if (tooltip.indexOf('Right-click') !== -1) return -0.3;
      if (!obtainable) return -0.2;
      if (tooltip.trim() === '') return -0.1;
      return 0;
    })();
    const score = score1 + score2;
    map.get(name).push({ item, score });
  }

  for (const [id, dupes] of map) {
    const cnt = dupes.length;
    if (dupes.length === 1) {
      const { item } = dupes[0];
      items2[item.id] = item;
    } else if (dupes.length > 1) {
      dupes.sort((a, b) => b.score - a.score);
      const bestScore = dupes[0].score;
      const candidates = [];
      while (dupes.length > 0 && dupes[0].score === bestScore) candidates.push(dupes.shift());

      const primary = [];
      const synonyms = [];

      if (candidates.length > 1) {
        const equips = candidates.filter(i => equipment.has(i.item.extra.equipId));
        if (equips.length > 0) {
          const top = equips.map(i => {
            const { item } = i;
            const score = equipment.get(item.extra.equipId) - (0.5 * item.extra.tradable);
            return { item, score };
          });
          top.sort((a, b) => b.score - a.score);
          const bestGear = top[0].score;
          while (top.length > 0 && top[0].score === bestGear) primary.push(top.shift());
          synonyms.push(...top);
        } else {
          primary.push(...candidates);
        }
      } else {
        primary.push(...candidates);
      }

      const best = primary.shift().item;
      items2[best.id] = best;
      const aliases = new Set();
      let i = 1;
      for (const { item } of [].concat(primary, synonyms)) {
        aliases.add(item.name);
        duplicates[item.id] = best.id;
        i++;
      }
      for (const { item } of dupes) {
        duplicates[item.id] = best.id;
        i++;
      }
      if (i !== cnt) {
        console.log('!!!', i, cnt);
      }
      aliases.delete(best.name);
      best.aliases = Array.from(aliases.values());
    }
  }

  items = items2;
}

const categories = {
  gear: {
    weapon: {
      warrior: [],
      lancer: [],
      slayer: [],
      berserker: [],
      sorcerer: [],
      archer: [],
      priest: [],
      mystic: [],
      reaper: [],
      gunner: [],
      brawler: [],
      ninja: [],
      valkyrie: [],
    },
    plate: {
      body: [],
      hand: [],
      feet: [],
    },
    leather: {
      body: [],
      hand: [],
      feet: [],
    },
    cloth: {
      body: [],
      hand: [],
      feet: [],
    },
    face: [],
    hair: [],
    underwear: [],
  },
  style: {
    weapon: {
      warrior: [],
      lancer: [],
      slayer: [],
      berserker: [],
      sorcerer: [],
      archer: [],
      priest: [],
      mystic: [],
      reaper: [],
      gunner: [],
      brawler: [],
      ninja: [],
      valkyrie: [],
    },
    body: [],
    face: [],
    hair: [],
    back: [],
    effect: [],
  },
};

{
  const unused = [];
  const conv = {
    part: {
      body: 'body',
      hand: 'hand',
      feet: 'feet',
    },
    type: {
      mail: 'plate',
      leather: 'leather',
      robe: 'cloth',
    },
  };

  for (const _id of Object.keys(items)) {
    const item = items[_id];
    const { id } = item;
    const style = item.extra.style ? 'style' : 'gear';
    const { category } = item.extra;
    delete item.extra;
    const index = CLASSES.weapon.indexOf(category);
    let match;
    if (index !== -1) {
      categories[style].weapon[CLASSES.name[index]].push(id);
    } else if (['back', 'effect', 'body', 'face', 'hair', 'underwear'].indexOf(category) !== -1) {
      categories[style][category].push(id);
    } else if (match = category.match(/^(body|hand|feet)(mail|leather|robe)$/)) {
      const part = conv.part[match[1]];
      const type = conv.type[match[2]];
      categories.gear[type][part].push(id);
    } else {
      unused.push(id);
    }
  }

  for (const id of unused) {
    console.log(items[id]);
    delete items[id];
  }
}

fs.writeFileSync('items.json', JSON.stringify({
  items,
  categories,
  duplicates,
}));
