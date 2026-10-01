# Equation Plaza — v0.41.0

Entry: **Arcade → Equation Plaza**, also available in the More menu.

## Modes and selected math

- Solo practice: untimed. Pick a goal (place 5 or 10 equations, reach 60 points, or free play); a progress bar tracks it, reaching it celebrates and offers the summary, and you can keep building. Finish practice opens a summary (equations placed, points, time, best play, goal) and saves the session. **Undo last Place** takes back the most recent play once (until the next Place, swap, or Finish).
- Computer: Apprentice, Technician, or Engineer searches progressively more legal scoring moves. Same arithmetic, rack, placement, scoring, and turn rules as humans.
- Pass & play: 2–4 people; hide the next rack behind a named handoff screen.
- Online friends: 2–4 devices; host creates a four-character room code or copies an invite link. Host selects the rules and validates all moves. Anyone who drops out keeps their seat and comes back without the code (see [Leaving and coming back](#leaving-and-coming-back-v0400)). No paid service was added; transport reuses the existing PeerJS integration.
- Competitive matches: 5, 8, or 10 turns **per player**, with equal-score shared wins. Dropping out never ends a match or awards a win. Only the host can end a match early, and a match ended early does not count toward records.

| Selection | Rules |
| --- | --- |
| Addition | Every number is within the chosen 10, 20, or 100 range. |
| Subtraction | Same ranges, nonnegative results. |
| Number bonds | Make 5, 10, 20, 50, or 100. Accept a+b=target and target−a=b, including reversed equality. |
| Multiplication | Selected tables 1–12; the other factor is 0–12. |
| Division | Selected divisors 1–12; exact whole-number quotient 0–12; no division by zero. |
| Mixed | Player-selected operations, addition/subtraction range, and multiplication/division tables. |

The first release uses one operation per equation. Multi-operation expressions, fractions, percentages, roots, parentheses, and quest unlocks are not part of this release.

## First session (v0.32.1)

A player's first Solo practice starts with a **guided first move**: the coach picks a short equation the rack can build, glows the next rack tile to tap, then the Check equation button, then Place, and ends with a card explaining the score. It can be skipped; afterwards the written rules stay as reference (collapsed), and the setup offers "Play the guided first move again". Without the guide, the first move still gets an affordance: the rack pulses, the tray reads "Tap a rack tile to start", Swap stays hidden and the board is dimmed until the first tile is chosen.

Every play shows a four-step bar under the tray: **1 Build · 2 Check equation · 3 Choose position · 4 Place**, with exactly one step active. Passing Check moves focus to Place.

The bonus-square legend sits above the board (shape + label + name), with "What do these mean?" opening a one-line meaning for each square; it opens once, after the guided move, on a player's first session.

## Board and controls

The original 11×11 board and premium layout are retained. Build an equation by tapping rack tiles in a large tray, or dragging rack tiles into the tray. Adjacent digit tiles form multi-digit numbers. Tap a tray tile to remove it. Tap a board tile to reuse that exact square. A reused tile is clearly marked in the tray.

Check equation validates the math without supplying its answer. Legal positions are offered only for the equation the player built. Choose a position with arrows or outlined board squares, then Place. Opening equals must cover the center. Subsequent moves must reuse at least one existing tile. Every new or changed perpendicular run of more than one tile must be a complete, valid equation; dangling fragments are rejected. The full contiguous main line is checked, including its boundaries.

Default board cells are 48px with horizontal scrolling. An optional whole-board overview trades cell size for context. Rack/tray touch controls stay at least 48px. Premiums use labels and shapes as well as color. There are no timers or forced animations. Worked teaching examples are explicitly labeled; independent trays never start solved.

## Racks and pacing

Racks have seven tiles for small addition/subtraction and bonds through 20; nine for larger numbers, multiplication, division, and mixed play. This allows equations such as 25+25=50.

Racks are generated from legal moves for the selected math, not from the handoff's fixed 73-tile bag. After a play, usable remaining tiles are retained and refilled. If remaining tiles cannot form a legal move, a playable rack is dealt for free. If no legal connection remains for the selected math, a fresh board opens while scores and turns are preserved. No solver answer or preferred digit is exposed to the player. Voluntary swaps use a competitive turn. There is no finite-bag end condition.

## Scoring and records

Every Place shows its score in words, before and after placing: face points, tile bonuses and equation multipliers, e.g. `(8 face + 1 tile bonus) × 2 equation bonus = 18`; crossing equations are listed separately, then the whole-rack bonus.

Face points: 0–3 and +/− = 1; 4–6 and × = 2; 7–9 and ÷ = 3; equals = 0. Only newly placed tiles score in each new equation. Premiums apply only when first covered. Multiple equation bonuses multiply. Cross equations score separately. A whole-rack play adds 10 points **once per turn**.

No bonuses, simple bonuses (double digit/equation), and full premium board are selectable. Center doubles only when bonuses are enabled. Fixed turn counts replace the handoff's 80-point target and +40 bonus.

Profile records save sessions, equations built by that profile, outright wins, and personal bests under the same settings. Friend/computer equations do not credit the profile. Board scores do not inflate Academy mastery. Existing saves receive empty Plaza records on load. An unfinished game is saved with the profile on this device and comes back after a reload.

## Multiplayer boundaries

The host owns the board and all racks. Each guest receives a personalized snapshot containing only their own rack. Commands carry a revision and are accepted only from the authenticated room peer on that player's turn. The host validates geometry, tile counts, arithmetic, and scoring, and reserves revisions synchronously to reject duplicated packets. Stale snapshots and malformed views are ignored. Lobby departures update the roster. Each guest sees only its own seat id (the others read seat-1, seat-2 and so on), because that id is what takes a seat back.

A local `window.__EQ_PEER_SERVER__` override is supported by the existing Room transport for development and self-hosting. No override is included in the published game.

## Phones: board first (v0.41.0)

On screens up to 640 px wide, a match fills one screen with no page scrolling. From the top down:
- **Top bar:** ← Leave, score chips and ⓘ. Solo practice shows points and goal progress. Matches show every player, whose turn it is, turns used and anyone away. The app's HP/Energy bar is hidden while playing.
- **Status line:** one line with the guided first move, errors, the chosen position and its score formula, whose turn it is, reconnecting, away players (with the host's Skip button), goal reached, or the last play.
- **Board:** the whole 11×11 board, sized to fit both the width and the height left over, so nothing scrolls sideways.
- **Tray:** a single line with ⌫ to remove the last tile. Tap any tray tile to remove that one.
- **Rack:** one row.
- **Adaptive button:** Check equation turns into Place · N pts, with ‹ 1/2 › beside it when there is more than one position. Swap and Undo sit on the same row.

While someone else plays, your own rack shows greyed out so you can plan. Pass & play hides it behind the "I'm ready" button.

The ⓘ sheet holds the four steps, Large tiles (the board scrolls inside its own box), Finish practice, the bonus-square meanings, recent moves and the full rules. Leave opens a bottom sheet with the same choices as before.

Checked in a browser at 390×844, 375×667 and 320×568: the guided move and two more moves, each reusing a board tile, were played with the board, tray, rack and button all on screen and no page scrolling. At 390 px wide, squares are about 31 px. Pass & play, a computer match and the desktop layout (unchanged) were checked too.

## Leaving and coming back (v0.40.0)

**Saved games.** An unfinished game in any mode is part of the profile's save on this device. Closing the app, reloading, or accepting an update puts the player back at the same board. Finished games are not brought back. A save from cloud sync or a file never brings in another device's Plaza game or room seat: this device keeps its own.

**Leave.** Solo practice's Leave finishes the session with its summary, as before. Leaving any other unfinished match keeps it for 24 hours. The Plaza setup screen then shows it at the top, with **Resume match** (computer, pass & play), **Rejoin the room** (online guest), or **Reopen the room** (online host), plus **Forget it**. Typing the same room code or opening the same invite link also returns to the same seat. The Arcade's Equation Plaza button reads "· resume" while a game can be picked up. The host's Leave dialog offers **Leave for now** (friends wait and reconnect when the host reopens) and **End the match for everyone**.

**Away seats.** When a guest drops (reload, lost signal, closed app, Leave), the host marks the seat *away*. The seat's rack and score stay, and play continues until that player's turn, which waits for them. The host can choose **Skip [name]'s turns until they're back**: each skipped turn counts as used, so everyone still finishes with the same number of turns. A player who comes back takes the seat again and plays on. When the host reopens a room, every guest starts as away until they reconnect.

**Reconnecting.** Guests try again on their own after 1.5 s, 3 s, 5 s and 8 s, then every 10 s for about five minutes, and then offer **Try again**. A host reopens the same room code, retrying while the signalling server lets go of the old one. The first board a guest receives after reconnecting is taken from the host even if it is older than the guest's copy (the host's copy is the true one). A first-time join with a wrong code still fails at once with the reason.

**Heartbeat.** A closed tab or a sleeping phone can leave a WebRTC link looking open for a long time. The host therefore pings every 4 s. A player silent for 15 s is marked away and their link is closed, so they reconnect cleanly. A guest that hears nothing from the host for 15 s reconnects. Copies of the game from before v0.40.0 do not answer pings and are never timed out. One screen holds a seat at a time: if the same seat connects from another screen, the older screen is told and stops trying, until someone taps Try again there.

**Shared transport.** The room transport (used by every online game) now reconnects an open room to the signalling server after that link drops. A join to a room that does not exist fails at once instead of after 12 s.

## Validation

Automated tests cover arithmetic selections and bounds, leading zeroes, malformed input, rack counts, opening geometry, crossings, reused anchors, scoring, playable racks, complete equal-turn matches for all six math selections, board refresh, state immutability, save migration, profile-only records, and private room protocol behavior.

Rejoin tests cover away seats, sitting out with equal turns, host-only early end, restoring and validating saves, Leave → resume, a guest and a host closing and reopening the app, one-tap rejoin, the heartbeat (quiet links, early drops, older clients), the retry limit and Try again, and one seat per screen. A two-browser check against a local PeerJS server covered a guest reload (back in under 0.2 s), a host reload (both back in about 1.5 s), guest Leave and Rejoin, host Leave for now and Reopen, a closed guest tab being noticed through the heartbeat, skipping and returning, and a computer match surviving a reload.

Browser checks cover a 390px touch layout, incorrect-equation recovery, connected placements, all six math selections, large number bonds, computer turns, pass-and-play handoff, invite routing, and a full online-protocol match between separate browser contexts using a controlled local transport. Native PeerJS signalling was exercised, but this executor exposed no ICE network candidates, so an end-to-end WebRTC connection could not be verified here. The published game uses the existing PeerJS transport; no test transport or signalling override is shipped.

## Source and publishing

Source: `chiokebuckley-art/command-center/engineering-quest`.
Published assets: `chiokebuckley-art/engineering-quest`, with **gh-pages** as the Pages publishing branch. Build using `QUEST_BASE=/engineering-quest/ npm run build`. Preserve existing public assets when publishing only changed build outputs.
