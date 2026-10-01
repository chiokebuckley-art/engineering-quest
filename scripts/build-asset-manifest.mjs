// Merges the per-folder asset manifests into public/assets/manifest.json and ASSET_LICENSES.md.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public/assets');
const entries = [];
for (const dir of await readdir(root)) {
  let files = [];
  try { files = await readdir(path.join(root, dir)); } catch { continue; }
  for (const f of files) {
    if (!f.startsWith('manifest.') || !f.endsWith('.json')) continue;
    const list = JSON.parse(await readFile(path.join(root, dir, f), 'utf8'));
    entries.push(...list);
  }
}
entries.push(
  { file: 'fonts: Orbitron (npm @fontsource/orbitron)', name: 'Orbitron', source: 'Google Fonts via Fontsource', creator: 'Matt McInerney', license: 'SIL OFL 1.1', url: 'https://fonts.google.com/specimen/Orbitron' },
  { file: 'fonts: Exo 2 (npm @fontsource/exo-2)', name: 'Exo 2', source: 'Google Fonts via Fontsource', creator: 'Natanael Gama', license: 'SIL OFL 1.1', url: 'https://fonts.google.com/specimen/Exo+2' },
);
entries.sort((a, b) => a.file.localeCompare(b.file));
await writeFile(path.join(root, 'manifest.json'), JSON.stringify(entries, null, 2));

const rows = entries.map((e) => `| ${e.file} | ${e.name} | ${e.source} | ${e.creator} | ${e.license} | ${e.url ? `[link](${e.url})` : '—'} |`).join('\n');
const md = `# Asset Licenses — ENGINEERING QUEST

Every visual asset used by the game, its source, creator and license. Regenerate with
\`node scripts/build-asset-manifest.mjs\` after adding assets (each asset folder keeps its own
\`manifest.<folder>.json\`). Icons are fetched by \`node scripts/fetch-icons.mjs\`.

Summary:
- **Icons** (\`public/assets/icons\`): game-icons.net, **CC BY 3.0** — attribution to the individual
  authors (Lorc, Delapouite, sbed, Skoll) is required and is given here and in each SVG's header comment.
- **Characters, enemies, environments, machines**: original artwork created for this project,
  released under **CC0 1.0** (public domain dedication). Each SVG carries a header comment saying so.
- **Fonts**: Orbitron and Exo 2, **SIL Open Font License 1.1**, bundled from npm (Fontsource) so the
  game never depends on an external font server.
- **Sound**: no audio files — all sound effects are synthesised at runtime with the Web Audio API
  (\`src/engine/sound/SoundEngine.ts\`).

No asset is loaded from a remote URL at runtime; everything ships inside \`public/assets\` or the bundle.

| File | Name | Source | Creator | License | URL |
|---|---|---|---|---|---|
${rows}
`;
await writeFile(path.resolve('ASSET_LICENSES.md'), md);
console.log(`manifest: ${entries.length} entries`);
