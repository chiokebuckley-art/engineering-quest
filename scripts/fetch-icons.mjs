// Downloads CC BY 3.0 icons from the game-icons.net repository (github.com/game-icons/icons)
// into public/assets/icons and writes a license manifest next to them.
// Usage: node scripts/fetch-icons.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://raw.githubusercontent.com/game-icons/icons/master';
const OUT = path.resolve('public/assets/icons');

// [local name, author folder, icon file]
const ICONS = [
  ['sword', 'lorc', 'broadsword'],
  ['shield', 'sbed', 'shield'],
  ['potion', 'lorc', 'potion-ball'],
  ['gear', 'lorc', 'gears'],
  ['cog', 'lorc', 'cog'],
  ['dragon', 'lorc', 'dragon-head'],
  ['map', 'lorc', 'treasure-map'],
  ['backpack', 'delapouite', 'backpack'],
  ['skill-tree', 'delapouite', 'family-tree'],
  ['lab', 'lorc', 'erlenmeyer'],
  ['flask', 'lorc', 'round-bottom-flask'],
  ['book', 'delapouite', 'book-cover'],
  ['scroll', 'lorc', 'scroll-unfurled'],
  ['anvil', 'lorc', 'anvil'],
  ['hammer', 'lorc', 'claw-hammer'],
  ['wrench', 'lorc', 'spanner'],
  ['bolt', 'delapouite', 'screw'],  // hex bolt
  ['nut', 'delapouite', 'hexagonal-nut'],
  ['ore', 'lorc', 'mineral-heart'],
  ['crystal', 'lorc', 'crystal-growth'],
  ['chest', 'lorc', 'locked-chest'],
  ['star', 'delapouite', 'round-star'],
  ['heart', 'skoll', 'hearts'],
  ['energy', 'lorc', 'lightning-storm'],  // player energy
  ['brain', 'lorc', 'brain'],
  ['dashboard', 'delapouite', 'progression'],
  ['quest', 'delapouite', 'stairs-goal'],
  ['trophy', 'delapouite', 'trophy-cup'],
  ['skull', 'lorc', 'skull-crossed-bones'],
  ['pickaxe', 'delapouite', 'war-pick'],
  ['lantern', 'lorc', 'lantern-flame'],
  ['gauge', 'delapouite', 'speedometer'],
  ['calipers', 'delapouite', 'measure-tape'],
  ['test-tubes', 'lorc', 'test-tubes'],
  ['gauntlet', 'delapouite', 'gauntlet'],
  ['ruler', 'lorc', 'stone-block'],
  ['fire', 'lorc', 'small-fire'],
  ['snowflake', 'lorc', 'snowflake-2'],
  ['home', 'delapouite', 'house'],
  ['mine', 'delapouite', 'mine-truck'],
  ['bridge', 'lorc', 'bridge'],
  ['pump', 'delapouite', 'water-tank'],  // water system
  ['boots', 'lorc', 'boots'],
  ['goggles', 'delapouite', 'steampunk-goggles'],
  ['gloves', 'delapouite', 'gloves'],
  ['helmet', 'delapouite', 'miner'],
  ['lock', 'lorc', 'padlock'],
  ['unlock', 'lorc', 'unlocking'],
  ['hourglass', 'lorc', 'hourglass'],
  ['calendar', 'delapouite', 'calendar'],
  ['target', 'lorc', 'target-arrows'],
  ['sound-on', 'delapouite', 'speaker'],
  ['sound-off', 'delapouite', 'speaker-off'],
  ['divide', 'lorc', 'crystal-shine'],
  ['multiply', 'lorc', 'cross-mark'],
  ['rock', 'lorc', 'rock'],
  ['abacus', 'delapouite', 'abacus'],
  ['robot', 'delapouite', 'robot-antennas'],
  ['circuit', 'lorc', 'circuitry'],
  ['reactor', 'delapouite', 'nuclear-plant'],
  ['telescope', 'delapouite', 'telescope'],
  ['factory', 'delapouite', 'factory'],
  ['bell', 'lorc', 'ringing-bell'],
  ['repair', 'lorc', 'auto-repair'],
  ['settings', 'delapouite', 'settings-knobs'],
  ['exit', 'delapouite', 'exit-door'],
  ['compass', 'lorc', 'compass'],
  ['medal', 'lorc', 'medal'],
  ['level-up', 'delapouite', 'upgrade'],
  ['coins', 'delapouite', 'coins'],
  ['screwdriver', 'lorc', 'screwdriver'],
];

const manifest = [];
await mkdir(OUT, { recursive: true });
let failed = 0;
for (const [local, author, name] of ICONS) {
  const url = `${BASE}/${author}/${name}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let svg = await res.text();
    if (!svg.includes('<svg')) throw new Error('not an svg');
    // Repo files ship as a black square with a white glyph; strip the square and make the
    // glyph recolourable via CSS currentColor (the UI uses them as mask-images).
    svg = svg.replace(/<path d="M0 0h512v512H0z"\/>/g, '').replace(/<path fill="#000" d="M0 0h512v512H0z"\/>/g, '');
    svg = svg.replace(/fill="#fff"/g, 'fill="currentColor"').replace(/fill="#ffffff"/g, 'fill="currentColor"');
    if (!svg.includes('fill="currentColor"')) svg = svg.replace('<svg', '<svg fill="currentColor"');
    const header = `<!-- "${name}" by ${author} from game-icons.net - License: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/) - Source: https://game-icons.net/1x1/${author}/${name}.html -->\n`;
    await writeFile(path.join(OUT, `${local}.svg`), header + svg);
    manifest.push({
      file: `icons/${local}.svg`,
      name,
      source: 'game-icons.net',
      creator: author,
      license: 'CC BY 3.0',
      url: `https://game-icons.net/1x1/${author}/${name}.html`,
    });
    console.log('ok  ', local, '<-', author + '/' + name);
  } catch (e) {
    failed++;
    console.log('FAIL', local, author + '/' + name, e.message);
  }
}
await writeFile(path.join(OUT, 'manifest.icons.json'), JSON.stringify(manifest, null, 2));
console.log(`done: ${manifest.length} ok, ${failed} failed`);
