# Teach cards: show the how, not just the answer (v0.42.0, all academies v0.43.0)

A teach card that shows a picture or a model must also show the working, not just the answer. Every such card has:

1. **What it means:** a plain definition.
2. **The rule:** the formula or rule in words.
3. **A worked example with numbers:** a worked equation in the text, or one line per step in `steps`.
4. **How the picture maps to the answer:** for example, "each segment is 5% = 2 coins".
5. **Something to try next:** `next`, shown as *Try next:*. A chapter's run of cards must end with at least one.

A short run of cards may share the work. For example, the percent trio defines, then renames, then works an example.

## How it is checked

`src/engine/__tests__/teach-cards.test.ts` holds every academy to the rule:
- **Show the working:** `src/engine/academy/teachCheck.ts` fails a card with a picture or model when neither its text nor its steps contain a worked equation (numbers on both sides of "=" with an operation or "of").
- **Try next:** every chapter except the trial must have at least one *Try next*.
- **Correct arithmetic:** `src/engine/academy/teachMath.ts` evaluates every plain-number equality on every card (0.25 × 40 = 10, (2 × 20)/(5 × 20) = 40/100) and fails on a wrong one. It skips algebra, function notation, units and statements that are false on purpose. A rounded value must be written with ≈, not =.

Trial chapters are rules, not maths, and are skipped.

## Arithmetic Academy: done

- **Percent of** (The Market Tariff) is rewritten: definition, the rule Amount = (percent ÷ 100) × whole, the worked example 25 ÷ 100 = 0.25 and 0.25 × 40 = 10, the quick way 40 ÷ 4 = 10, and how the dial maps to it (each segment = 2 coins, 5 × 2 = 10).
- **Percent means out of 100**, **Up and down**, **Ratio tables**, **Unit rate**, **Equivalent ratios**, **See it at a glance**, **Perfect squares first** and **The whole stack** are rewritten.
- **Adding pieces, taking "of"** is split into **Adding pieces** and **Taking "of"**.
- Every other card with a picture got worked lines, and every chapter has a *Try next*.
- **The percent dial:** the caption now names the coins per segment for any whole. In a question it shows only the percent shaded; the player works out and types the coins. The practice question's hint and steps use the same rule as the teach card.

Checked on a phone: all 15 guided quests played, 128/128 answers right, no overflow.

## All academies (v0.43.0)

Every teach card in the other nine academies now works an example with numbers, using its own picture's numbers, function, figure or matrix wherever the picture has them:

| Academy | Cards changed |
| --- | --- |
| Pre-Algebra | 23 |
| Algebra 1 | 25 |
| Geometry | 32 |
| Algebra 2 | 22 |
| Trigonometry | 30 |
| Pre-Calculus | 25 |
| Calculus | 24 |
| Linear Algebra | 36 |
| Differential Equations | 36 |

Every chapter ends with a *Try next*. A few cards had examples that did not match their own picture (f(2) = 7 on a model that gives 5; F(0) = 3 where the graph marks 2; a table example that gave away the table's blanks). These now match.

An independent second review then checked the algebra, trigonometry, calculus, matrices and differential equations, and each example against its picture. It found and fixed 22 small problems:
- a resonance claim the curve never reaches;
- one letter naming two different functions;
- Try nexts that answered themselves;
- rounded values written with = instead of ≈;
- labels that clashed with a picture.

Checked on a phone: every chapter's guided quest in all ten academies was played, with all answers right, no overflow and no console errors.
