# ENGINEERING QUEST — playable build

An RPG that teaches mathematics from multiplication facts toward the mathematics of chemical
engineering, electrical engineering and physics.

**Play:** https://chiokebuckley-art.github.io/engineering-quest/

This repository holds the built, static game. GitHub Pages publishes the `gh-pages` branch; `main` mirrors the same files. To ship a new build, run `npm run build` in the source project with `QUEST_BASE=/engineering-quest/` and push `dist/` to `gh-pages`. Progress is saved in your
browser (use Settings → Export inside the game to move it between devices). On a phone, open the link
and choose "Add to Home Screen" to install it like an app.

Artwork and font licenses: see `ASSET_LICENSES.md` (original CC0 artwork, CC BY 3.0 icons from
game-icons.net, OFL fonts).
