# Count Lab — v0.33.0

Count Lab is an additive, parent-gated activity at Probability Research Station. Entry points: Arcade, Quest Log and the `stats-station` world-map panel/region. Existing `prob.*` lessons are unchanged.

## Learning and play

- Nine stages: card values, flashes, three clean 15-card tracks, deck estimation, true-count division, EV experiments, open-count play, hidden-count play, and a daily exam.
- Independent stage unlocks require 100% accuracy; the supplied handoff's final exam threshold remains 85% across four equally weighted blocks. Opening a Hi-Lo hint marks that item assisted, so it cannot grant mastery.
- Flash rounds: untimed 20 cards or 30/60/90 seconds; accuracy, streak and mean reaction time. Running tracks: 10/15/20/30, per-card or end submission. Calculator sets deliberately cover 1–9 deck sizes.
- Table: 1–9 decks unlocked progressively; Fisher–Yates seedable shuffle; Hi-Lo counts visible cards only; true count uses `running / max(cards_left/52, .5)`; HUD rounds to nearest half, with symmetric negative rounding.
- Practice chips begin at 250 per observation session and have no other app effects. No purchases, payments, external links, redeeming or multiplayer staking.
- S17 default; H17 optional. 3:2 naturals, US peek, insurance, late surrender, double, DAS, split once into two hands; RSA optionally permits up to four Ace hands. Split Aces take one card; split 21 pays 1:1. No hidden mid-shoe shuffles.
- The cut threshold is floor(decks × 52 × chosen penetration), checked between hands. A rare exhausted shoe voids the unfinished round, restores the round's starting chips, reveals the existing hole card and ends the shoe. It never invents cards or changes the RNG to manipulate outcomes.
- Always/after/never count displays. Mission and exam checkpoints hide the HUD before submission; never-mode table practice waits until the shoe-end report. Hidden card rank, suit and Hi-Lo value are absent from rendered markup and accessibility labels. Screen readers announce rank/suit only during questions.
- Daily exam uses America/Chicago's date and four seeded blocks: ten flashes, a 15-card end-commit track, nine calculator questions and three nine-deck hands. The table score measures submitted counts, never bankroll luck. Badge and daily bests persist privately per profile.

## Parent controls and persistence

`countLab` is migrated with defaults in the existing profile save. `countUnlocked` resets on load. The PIN verifier uses a random salt and SHA-256; entry and control changes require the PIN. This is a household UI control, not a tamper-resistant authentication system: anyone who can edit browser storage or reset a profile controls that save. No secret account credential is involved. No in-product PIN bypass/recovery is provided.

Parents can disable timers, cap table decks and hide the classroom unit-spread reference. Numerically teaching a nine-deck division example does not override the table deck cap. Exam entry requires nine decks to be allowed. Shoe/deck progression and other math mastery are separate. Recent twenty practice reports and all daily bests are stored. Incomplete runs do not grant progress; they restart after reload.

`COUNT_LAB_ENABLED` is the build flag. The UI gate and reducer auth both check it. The screen always guards interactive activities with `countUnlocked`.

## Reference scope and deliberate clarifications

The original image is a visual reference for the green table, brass instruments and research-station tone. Cards, count displays, trays and controls are rendered from actual state, never embedded as solved answers in background art. V1 is player versus house, as specified in the handoff; decorative extra player seats are not fake multiplayer.

The basic-strategy reference is a complete total-dependent 4–8-deck S17/DAS/late-surrender baseline; post-hand comparisons account for the active H17/DAS setting. It is clearly labelled approximate for one–three and nine decks rather than claiming an exact composition-dependent optimum for every shoe. References consulted 2026-09-26:

- Michael Shackleford, 4–8-deck basic strategy: https://wizardofodds.com/games/blackjack/strategy/4-decks/
- The user-provided Count Lab developer handoff, September 26, 2026.

Those references are developer documentation only; no gambling/affiliate URLs are shipped in the Count Lab UI.

EV exercises use explicitly hypothetical probabilities, not invented estimates of a real game's house edge. The handoff's fixed unit-spread table is labelled a classroom heuristic, not a mathematically calculated Kelly fraction. There is no count-based promise of profit. No automatic playing, hidden-card strategy peeks, or real-world gambling coaching.

## Verification

- Automated engine tests cover all nine shoe sizes and four penetration settings; exact rank composition; seeded shuffling; count examples and random oracles; Ace totals; payouts, insurance/peek, split/DAS/RSA/surrender; H17; invalid actions; exhaustion refunds; complete seeded shoes; profile migration; PIN entry; sequential unlocks and 85% exam boundary.
- Browser QA traverses the actual UI from a fresh legacy profile through PIN setup, every stage, the daily nine-deck exam and badge reload. It checks wrong-PIN rejection, hidden answer markup, mobile overflow and runtime errors. Additional UI cases cover timer completion, assisted/wrong answers, parent limits and all three table HUD policies.
