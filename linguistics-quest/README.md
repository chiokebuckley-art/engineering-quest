# Linguistics Quest

A standalone, dependency-free companion to Engineering Quest. Open `linguistics-quest/` from the existing GitHub Pages game, or `/quest/linguistics-quest/` in Command Center.

## Small Common Word Academy

Open `academy/` or the academy card on the learning path. It adds 3,000 original vector illustrated scenes across 60 selected common-word uses and 50 object contexts, with sequential completion, teaching before checks, a freely browsable picture library, SVG downloads, and shared family profiles. Scene count is distinct from meaning count. See `academy/README.md` for scope, provenance, and validation.

## Learning experience

- 108 sequential lessons across kindergarten through grade 12, covering all 294 guided meanings once. Choose the current school grade as a finish line; every new course starts at kindergarten.
- Each meaning has three teaching pages: explanation, example and contrast, and a say/show activity. Guided practice comes before two independent meaning-in-context checks. A mistake returns to teaching.
- Checkpoints save after each step. Completing every meaning unlocks the next lesson; each grade earns a foundation badge. Prior quiz saves migrate without losing review records.
- 12 topic trails remain available for extra practice, with two examples and a misconception note per entry.
- Grade stages are an editorial vocabulary and symbol sequence, not a complete K–12 school curriculum or standardized grade placement. The adult goal covers the whole sequence. Extra-practice difficulty follows the selected grade.
- Definition recognition, meaning in context, and typed word retrieval. Symbols use recognition and context instead of requiring specialized keyboard input.
- Practice, Context detective, Symbol decoder, optional 60-second sprint, Conquer, personal collection, diagnostics, and adaptive repair/review sessions.
- Optional device speech synthesis. Every quiz has a read-aloud control; the active profile can enable automatic question reading.
- Per-sense records, confidence before answers, hints separated from unassisted success, and transparent spaced review.
- Family profiles stored only in localStorage, with validated JSON export/import. No cloud accounts, passwords, tracking, or payment services. Profile selection is not a parental-control lock.

## Coverage and evidence

The guided curriculum is distinct from the extended adult reference:

| Collection | Count | What the count means |
|---|---:|---|
| Original guided entries | 294 | A word sense, word-part use, or symbol use |
| WordNet 3.0 headwords | 147,318 | Unique normalized dictionary forms, including multiword terms |
| Headword–sense links | 206,978 | One headword associated with one synset |
| WordNet synsets | 117,659 | Sets of synonymous forms with a shared definition |
| Unicode 15.0.0 index | 8,612 | Named characters in punctuation/symbol categories |

The dictionary is general reference content and can include sensitive, technical, or dated words. It is available only on the adult path. Exact or prefix search loads one compressed letter shard, at most 80 sense results at a time. Any sense can be added to the adult profile's collection for quizzes. This is a practical collection, not every English word, inflection, contemporary term, or possible meaning. WordNet does not cover function words comprehensively; the guided content supplies those separately.

Unicode character names identify encoded forms. They are not exhaustive semantic definitions. The guided lessons explain specific symbol uses. A Unicode index entry is not counted as a learned meaning merely because it was viewed or copied.

No proprietary COCA frequency tables, Nation lists, or dictionary content were copied without a redistribution license. Definitions and examples in `content.js` are original instructional text. The large dictionary is Princeton WordNet 3.0, with its full license bundled. Unicode data carries its attribution and license. Fonts reuse the existing Sentence Forge assets and their OFL notices.

## Mastery rules

An entry is retained only with at least four consecutive unassisted correct answers, on at least three UTC dates, across definition/context/word-retrieval forms as applicable, and while its review is current. The intervals are 1, 3, 7, 14, 30, and 60 days. A miss or hint resets the qualifying evidence and enters repair. Two clean answers clear the repair flag. Course completion requires both independent checks for every meaning; guided answers grant no review credit. Course badges, mission badges, and XP are separate from retained mastery. No-example dictionary entries can show recognition/retrieval retention but cannot demonstrate context transfer. These are game rules, not psychometrically validated cutoffs or vocabulary-size estimates.

The short diagnostic samples the 12 trails without granting mastery. It recommends the lowest-level sampled difficulty, never a reading age or population word count.

## Development and verification

Serve this directory with a static HTTP server. ES modules need HTTP, not `file://`.

```
node --test tests/engine.test.mjs tests/course.test.mjs
# With jsdom installed:
node --test tests/ui.test.mjs
python3 -m http.server 5184
```

The unit suite checks content integrity, quiz answers, same-day mastery exclusion, lapse/hint behavior, profile validation/isolation, appropriate queues, and every compressed reference shard against the manifest. Browser/UI checks are documented in `tests/QA.md`.

`course.js` defines the sequence, teaching scaffolds, and checkpoint rules. `course-ui.js` implements enrollment, progression, and teaching. `engine.js` is pure game logic. `content.js` contains original curriculum. `app.js` owns UI and device-local persistence. `style.css` includes phone and reduced-motion layouts. `data/` contains licensed reference resources. The compressed dictionary uses the standard `DecompressionStream` API; an older browser gets an explanatory error while guided gameplay remains usable. An internet connection is required for first loads and for dictionary shards; there is deliberately no new service worker that could interfere with the existing games.

Rebuild the reference from NLTK's WordNet archive:

```
python3 scripts/build-reference.py /path/to/wordnet.zip
```

The manifest records the source archive SHA-256 and Unicode version. Original archive: https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/wordnet.zip

Research references and interpretation are available in-game under How learning works.
