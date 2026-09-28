# Engine City Tycoon (v0.35.0)

A property-trading board game in the Arcade where every money move is a maths problem. Open it from **Arcade → Engine City Tycoon** or **More → Engine City Tycoon**.

## Setup

- **Level** (chosen per game):
  - **Junior**: adding and subtracting within 100, doubles and halves. Rent is base + 10 per workshop.
  - **Explorer**: times tables, division, fractions, decimals and percentages. Rent is base × (workshops + 1)².
  - **Tycoon**: percentage change, ratios, equations, Pythagoras and trigonometry, plus 5% bank interest each lap.
- **Length**:
  - **Quick**: 15 rounds, then the richest player wins.
  - **Classic**: play until one player is left, with a cap of 60 rounds.
- **Players**: you, plus up to three more. Each extra seat can be a computer player (easy, normal or hard) or a friend on the same device.
- **Online**: create a room and share the four-letter code or the invite link; friends join from their own devices. The host's device runs the game, and computer players can fill empty seats.

## The board

There are 40 spaces. The eight colour groups follow the world map in learning order:

| Group | Region |
|---|---|
| Brown | Arithmetic Village |
| Light blue | Multiplication Mines |
| Pink | Division Dungeon |
| Orange | Fraction Forest |
| Red | Decimal Docks |
| Yellow | Ratio Ridge |
| Green | Algebra Heights |
| Dark blue | Trig Mountains |

The other spaces:

- **Rail lines** (Plus, Minus, Times, Divide): rent doubles for each line owned (25, 50, 100, 200).
- **Utilities**: rent is the dice total × 4, or × 10 if one player owns both.
- **Toll Bridge**: pay 10% of your gears, rounded to the nearest 10. Junior players pay a flat 50.
- **Luxury Levy**: pay 75.
- **Puzzle cards**: estimation, comparing, rounding, odd or even.
- **Workshop Chest cards**: interest, repairs, birthdays, prize shares and sales, each worked out by the player.
- **Ledger Park**: taxes go into its jar, and the player who lands there takes it by adding up the deposits exactly.
- **Error Book Cell**: the jail. To leave, fix one of your saved Notebook mistakes, pay 50, or roll doubles within three tries.

## Rules that teach

- **Buying**: answer a question from the street's colour group. A wrong answer shows the worked steps and the street stays for sale. Rail lines and utilities ask how many gears you'll have left.
- **Rent**: the player who owes it works it out.
  - A right answer earns a Sharp Mind token, which takes 10% off your next rent. You can hold up to 3.
  - A wrong answer still pays the right amount, shows the steps, and adds the question to your Notebook.
- **Building**: you need the whole colour set, with nothing in it mortgaged. Each workshop needs a right answer to a harder question from that group. The fourth workshop is an Engine Hall.
- **Money**:
  - Mortgaging a street gives you half its price; buying it back costs that plus 10%.
  - When you can't pay, workshops are sold at half price and streets are mortgaged automatically. If that still isn't enough, you're out and your streets go to the player you owed.
- **Dice odds**: the chart shows how likely each total is out of 36.

## End of game: the Ledger

- Final standings by net worth: gears, plus streets (half if mortgaged), plus workshops.
- Rent paid and earned, and right answers for each player.
- A chart of each player's net worth, round by round.
- Your own answers count towards mastery, and any misses go to your Notebook. You also earn XP and a toast.

## Code map

- `src/engine/tycoon/`:
  - `board.ts`: spaces, groups and rent rules
  - `questions.ts`: the questions for each group and level
  - `game.ts`: rules, cards and computer players
  - `online.ts`: lobby, launch, guest moves and view checks
  - `record.ts`: the saved win/loss record
- `src/game/tycoon/`: `TycoonScreen.tsx`, `Board.tsx` and `tycoon.css`.
- `src/game/hooks/useTycoonRoom.ts`: the online room.
- Tests: `src/engine/__tests__/tycoon.test.ts`. They play full computer-only games at every level.
