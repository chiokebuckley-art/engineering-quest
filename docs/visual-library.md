# Visual Library and Name the Image

265 cards: 45 K–12 Geometry, 110 Physics/Chemical Engineering, 110 Electrical Engineering. The Academy campus and hubs open lessons; Geometry chapters filter relevant cards; Arcade opens naming practice. Advanced subjects have separate pools and optional related math chapter links.

Lessons show the supplied illustrated card, corrected definitions and identifying features. Explicit study or starting practice marks a card studied. Practice defaults to studied cards; Explore all is optional. Multiple choice uses four distinct names within the selected subject; typed recall accepts listed aliases and normalized punctuation/spacing. Mistakes enter review; two successful typed recalls clear the review flag. Feedback remains visible when the final review item clears. Progress is included in existing save/profile/export/load flows.

Quiz images have numeric filenames and generic alt text. Definitions, lesson titles and browse labels are absent before a typed answer. Each crop and text mask is recorded in visual-library-art-audit.json, with the source SHA-256. All source pixels and all generated quiz pairs were visually inspected; text masking supplements individual crop decisions. Graph symbols/numerals remain where needed to interpret the diagram.

To rebuild assets, install Pillow and run `python scripts/prepare-visual-library.py /path/to/extracted/cards-265`. The source must contain manifest.json, scientific-corrections.json and cards/. The checked-in OCR results and per-card bounds make rebuilding deterministic. Assets are optimized WebP; original PNGs are not shipped.

## Source and validation

Recovered from command-center main commit f65f275a98789826bf31de898f7ba53631951546. The recovery baseline is a local snapshot commit, not the upstream Git history. All 617 recovered source/public files matched upstream Git blob SHA values. Seventeen historical documentation screenshots were not needed for build and were omitted from recovery.

Full suite: 68 test files, 878 tests passed. New tests cover all-card inventory, subject isolation, aliases/distractors, migration, saved progress across repeated navigation, duplicate submissions, hidden-answer DOM, same-card retries and review completion. TypeScript and asset-reference checks passed. Production build passed. Existing large-chunk warnings remain.

Desktop browser checks confirmed Academy/Arcade entry, studied default, lessons, correct choice and incorrect typed feedback. After reconnection, browser checks passed at 390 × 844 mobile, 768 × 1024 tablet and 1440 × 900 desktop with no horizontal overflow. Reload preserved one recognized/two recalled and the cleared missed flag; Academy/Arcade repeated navigation retained progress; an unfinished answer was discarded without logging an attempt; two typed recalls cleared review and the empty review state rendered correctly. Geometry chapter return filtered nine solid cards. Advanced practice remained isolated, with numeric artwork filenames and no names or definitions in the pre-answer DOM. Final targeted tests: seven passed. Fixed completion counter and restored top scroll position when changing mode, subject or chapter. The existing development server has a lazy initialization runtime failure; production preview works.

No deployment or remote push performed. Apply the delivered patch to the actual command-center checkout, complete the remaining browser checks, then use its established publishing workflow only when authorized.
