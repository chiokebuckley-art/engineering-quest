# ENGINEERING QUEST — Art Style Guide (for original SVG assets)

Theme: SCIENCE FICTION + ENGINEERING + LIGHT FANTASY RPG, for an ADULT audience
(engineering, labs, machines, industrial systems). Not childish, not cartoon-cute.
World 1 (arithmetic) era look: "ancient mathematical machinery" — dark stone, brass,
copper, iron rivets, glowing amber/teal runes and gauges. Later eras get more chrome,
cyan/violet energy, holographic panels.

## Technical rules (MANDATORY)
- Pure, self-contained SVG. No `<script>`, no external `href`/`xlink:href`, no
  embedded raster images, no fonts, no `<text>` (all text is rendered by the UI).
- Start each file with:
  `<!-- Original artwork created for ENGINEERING QUEST. License: CC0 1.0 (public domain). -->`
- Root element must have `xmlns="http://www.w3.org/2000/svg"`, a `viewBox`, and a
  `role="img"` plus `<title>` element describing the image.
- Characters / enemies / items: `viewBox="0 0 256 256"`, transparent background,
  the subject centred and filling ~80% of the box, strong readable silhouette.
- Environments: `viewBox="0 0 1280 720"` with `preserveAspectRatio="xMidYMid slice"`,
  full opaque background, horizon roughly at y=430 so a UI panel can sit on the
  lower third. Foreground details on the left and right edges, an open centre
  where a character/enemy sprite will be overlaid.
- Machines: `viewBox="0 0 512 384"`, transparent background.
- Use `<defs>` with `linearGradient`/`radialGradient` for shading, 1–2 px darker
  outlines (`stroke`) on major shapes, subtle inner highlights. Keep every file
  under 25 KB. Use only plain shapes (path, rect, circle, ellipse, polygon, g).
  Use `id`s prefixed with the file name (e.g. `slime-g1`) so multiple SVGs can be
  inlined on one page without id clashes.
- Palette (hex): deep background #0b1020 / #111a2e; stone #3b4252 #4c566a; brass
  #c9a227 #8a6d1d; copper #b87333; iron #6b7280; amber glow #ffb347; teal glow
  #2dd4bf; cyan #22d3ee; violet #a78bfa; danger red #ef4444; nature green #4ade80;
  bone #e5e7eb.
- Enemies should look like they belong in a MINE / ancient machine complex, with a
  mathematical or mechanical motif (gears, runes, crystals, circuitry, ore).
- Nothing gory. Menacing but stylised.
