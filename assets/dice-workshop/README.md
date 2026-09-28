# Dice Workshop

Original Blender environment for Eng. Quest, with runtime dice and a live scorecard in Three.js. Open Arcade → Dice Workshop to play.

Solo, untimed 13-turn dice game with up to three rolls per turn. Choose addition, equal groups, or both; hold individual dice; check answers or use worked steps; record one score per turn. Zero scores require confirmation. Progress and best scores are stored with the existing player profile. Family portraits reuse the shared avatar picker. Simple view keeps all controls available without WebGL.

Scoring follows the familiar five-dice categories, upper-section bonus and repeat-five Joker rules. Reference: https://www.hasbro.com/common/instruct/yahtzee.pdf
The game is branded Dice Workshop; it does not use official game logos or artwork.

`table.glb` is the exported Blender table. Baked example dice/text are hidden and replaced at runtime. `preview.png` is the original concept render, used on the setup screen only.

Validation: all 7,776 dice outcomes checked; hold/roll limits, math gating, assistance, bonuses, complete games, saved-game recovery, and actual UI control sequences covered by automated tests. Six face orientations and GLB loading are tested. Browser automation was unavailable during this release, so automated interactions do not establish visual QA on a physical phone.
