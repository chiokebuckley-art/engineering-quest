# Solving English Problems — playable build

One app for English made from three complete learning worlds: **Sentence Forge** (building sentences, the Pawprint Trail reading adventure, the Read & Rescue Rally), **Linguistics Quest** (small common words from kindergarten to grade 12, the Small Common Word Academy, the adult dictionary and symbol index, My Visual Library) and **Word Raiders** (prefixes, roots and suffixes as a 3D quest, the Sentence Academy, the Word Arcade). The hub adds a placement exam, a course of action, a study menu with every function one tap away, one progress page and one backup for everything.

**Play:** https://chiokebuckley-art.github.io/solving-english-problems/

On a phone, open the link and choose **Add to Home Screen** to install it like an app. Progress is saved in your browser; use Learner → Export everything inside the app to move it between devices.

This repository holds the built, static app. GitHub Pages publishes the `gh-pages` branch; `main` mirrors the same files. The source lives in the `solving-english-problems/` folder of the `command-center` repository: run `npm run build` there (it builds Word Raiders into the folder), then push the folder with `.nojekyll` and a `404.html` copy of `index.html` to `gh-pages`.
