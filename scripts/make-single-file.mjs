// Post-processes the vite single-file build: injects every SVG under public/assets as a data URI
// (via window.__EQ_ASSETS__ and by replacing literal /assets/... paths) so the game runs from one
// HTML file — no server needed. Also writes an "artifact body" variant without the document shell.
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public/assets');
async function walk(dir) { const out = []; for (const e of await readdir(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) out.push(...await walk(p)); else if (e.name.endsWith('.svg')) out.push(p); } return out; }
const files = await walk(root);
const map = {};
for (const f of files) {
  const rel = '/assets/' + path.relative(root, f).split(path.sep).join('/');
  const svg = await readFile(f, 'utf8');
  map[rel] = 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
}
let html = await readFile(path.resolve('dist-single/index.html'), 'utf8');
// Drop the file-based favicon link (it would 404 from a single file), then inline literal paths.
html = html.replace(/<link[^>]*rel="(icon|manifest|apple-touch-icon)"[^>]*>/g, '');
for (const [k, v] of Object.entries(map)) html = html.split('.' + k).join(v).split(k).join(v);
const inject = `<script>window.__EQ_ASSETS__=${JSON.stringify(map)};</script>`;
html = html.replace('<div id="root"></div>', `${inject}<div id="root"></div>`);
await writeFile(path.resolve('dist-single/engineering-quest.html'), html);

// Artifact variant: only what goes inside <body>-ish: title + styles + scripts + root.
const title = '<title>Engineering Quest</title>';
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n');
const scripts = [...html.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]);
const body = `${title}\n${styles}\n${scripts.join('\n')}\n<div id="root"></div>\n`;
await writeFile(path.resolve('dist-single/artifact.html'), body);
const sz = (await stat(path.resolve('dist-single/engineering-quest.html'))).size;
console.log(`single file: ${(sz / 1024 / 1024).toFixed(2)} MB, ${Object.keys(map).length} assets inlined`);
