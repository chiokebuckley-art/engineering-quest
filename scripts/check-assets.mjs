// Verifies every /assets/... path referenced in src/ exists on disk.
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
async function walk(dir) { const out = []; for (const e of await readdir(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) out.push(...await walk(p)); else out.push(p); } return out; }
const files = (await walk('src')).filter((f) => /\.(tsx?|css)$/.test(f));
const refs = new Set();
for (const f of files) for (const m of (await readFile(f, 'utf8')).matchAll(/\/assets\/[a-z0-9\-_/.]+\.svg/g)) refs.add(m[0]);
// Dynamic icon names: Icon name="x" → /assets/icons/x.svg
for (const f of files) for (const m of (await readFile(f, 'utf8')).matchAll(/(?:name|icon)=["'`]([a-z0-9-]+)["'`]/g)) refs.add(`/assets/icons/${m[1]}.svg`);
for (const f of files) for (const m of (await readFile(f, 'utf8')).matchAll(/icon\('([a-z0-9-]+)'\)/g)) refs.add(`/assets/icons/${m[1]}.svg`);
for (const f of files) for (const m of (await readFile(f, 'utf8')).matchAll(/sprite\('([a-z0-9-]+)'\)/g)) refs.add(`/assets/enemies/${m[1]}.svg`);
for (const f of files) for (const m of (await readFile(f, 'utf8')).matchAll(/env\('([a-z0-9-]+)'\)/g)) refs.add(`/assets/environments/${m[1]}.svg`);
for (const f of files) for (const m of (await readFile(f, 'utf8')).matchAll(/\bm\('([a-z0-9-]+)'\)/g)) refs.add(`/assets/machines/${m[1]}.svg`);
for (const f of files) for (const m of (await readFile(f, 'utf8')).matchAll(/\bp\('([a-z0-9-]+)'\)/g)) refs.add(`/assets/characters/${m[1]}.svg`);
let missing = 0;
for (const r of [...refs].sort()) { try { await stat(path.join('public', r)); } catch { missing++; console.log('MISSING', r); } }
console.log(`${refs.size} asset references checked, ${missing} missing`);
process.exit(missing ? 1 : 0);
