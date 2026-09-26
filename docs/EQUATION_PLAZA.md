# Equation Plaza — v0.32.0

Entry: **Arcade → Equation Plaza**, also available in the More menu.

## Modes and selected math

- Solo practice: untimed, unlimited turns; Finish practice saves the session.
- Computer: Apprentice, Technician, or Engineer searches progressively more legal scoring moves. Same arithmetic, rack, placement, scoring, and turn rules as humans.
- Pass & play: 2–4 people; hide the next rack behind a named handoff screen.
- Online friends: 2–4 devices; host creates a four-character room code or copies an invite link. Host selects the rules, validates all moves, and must stay connected. No paid service was added; transport reuses the existing PeerJS integration.
- Competitive matches: 5, 8, or 10 turns **per player**, with equal-score shared wins. Leaving/disconnecting does not award an early-match win.

| Selection | Rules |
| --- | --- |
| Addition | Every number is within the chosen 10, 20, or 100 range. |
| Subtraction | Same ranges, nonnegative results. |
| Number bonds | Make 5, 10, 20, 50, or 100. Accept a+b=target and target−a=b, including reversed equality. |
| Multiplication | Selected tables 1–12; the other factor is 0–12. |
| Division | Selected divisors 1–12; exact whole-number quotient 0–12; no division by zero. |
| Mixed | Player-selected operations, addition/subtraction range, and multiplication/division tables. |

The first release uses one operation per equation. Multi-operation expressions, fractions, percentages, roots, parentheses, and quest unlocks are not part of this release.

## Board and controls

The original 11×11 board and premium layout are retained. Build an equation by tapping rack tiles in a large tray, or dragging rack tiles into the tray. Adjacent digit tiles form multi-digit numbers. Tap a tray tile to remove it. Tap a board tile to reuse that exact square. A reused tile is clearly marked in the tray.

Check equation validates the math without supplying its answer. Legal positions are offered only for the equation the player built. Choose a position with arrows or outlined board squares, then Place. Opening equals must cover the center. Subsequent moves must reuse at least one existing tile. Every new or changed perpendicular run of more than one tile must be a complete, valid equation; dangling fragments are rejected. The full contiguous main line is checked, including its boundaries.

Default board cells are 48px with horizontal scrolling. An optional whole-board overview trades cell size for context. Rack/tray touch controls stay at least 48px. Premiums use labels and shapes as well as color. There are no timers or forced animations. Worked teaching examples are explicitly labeled; independent trays never start solved.

## Racks and pacing

Racks have seven tiles for small addition/subtraction and bonds through 20; nine for larger numbers, multiplication, division, and mixed play. This allows equations such as 25+25=50.

Racks are generated from legal moves for the selected math, not from the handoff's fixed 73-tile bag. After a play, usable remaining tiles are retained and refilled. If remaining tiles cannot form a legal move, a playable rack is dealt for free. If no legal connection remains for the selected math, a fresh board opens while scores and turns are preserved. No solver answer or preferred digit is exposed to the player. Voluntary swaps use a competitive turn. There is no finite-bag end condition.

## Scoring and records

Face points: 0–3 and +/− = 1; 4–6 and × = 2; 7–9 and ÷ = 3; equals = 0. Only newly placed tiles score in each new equation. Premiums apply only when first covered. Multiple equation bonuses multiply. Cross equations score separately. A whole-rack play adds 10 points **once per turn**.

No bonuses, simple bonuses (double digit/equation), and full premium board are selectable. Center doubles only when bonuses are enabled. Fixed turn counts replace the handoff's 80-point target and +40 bonus.

Profile records save sessions, equations built by that profile, outright wins, and personal bests under the same settings. Friend/computer equations do not credit the profile. Board scores do not inflate Academy mastery. Existing saves receive empty Plaza records on load; the current online/transient match is reset on reload, matching other Arcade games.

## Multiplayer boundaries

The host owns the board and all racks. Each guest receives a personalized snapshot containing only their own rack. Commands carry a revision and are accepted only from the authenticated room peer on that player's turn. The host validates geometry, tile counts, arithmetic, and scoring, and reserves revisions synchronously to reject duplicated packets. Stale snapshots and malformed views are ignored. Lobby departures update the roster; game departures are explicitly marked. With fewer than two connected players, the match ends without counting toward records.

A local `window.__EQ_PEER_SERVER__` override is supported by the existing Room transport for development and self-hosting. No override is included in the published game.

## Validation

Automated tests cover arithmetic selections and bounds, leading zeroes, malformed input, rack counts, opening geometry, crossings, reused anchors, scoring, playable racks, complete equal-turn matches for all six math selections, board refresh, state immutability, save migration, profile-only records, and private room protocol behavior.

Browser checks cover a 390px touch layout, incorrect-equation recovery, connected placements, all six math selections, large number bonds, computer turns, pass-and-play handoff, invite routing, and a full online-protocol match between separate browser contexts using a controlled local transport. Native PeerJS signalling was exercised, but this executor exposed no ICE network candidates, so an end-to-end WebRTC connection could not be verified here. The published game uses the existing PeerJS transport; no test transport or signalling override is shipped.

## Source and publishing

Source: `chiokebuckley-art/command-center/engineering-quest`.
Published assets: `chiokebuckley-art/engineering-quest`, with **gh-pages** as the Pages publishing branch. Build using `QUEST_BASE=/engineering-quest/ npm run build`. Preserve existing public assets when publishing only changed build outputs.
