# Percentage learning sequence (v0.31.2)

The Market Tariff and Forest & River Plaques now start with three linked decisions: make the denominator 100, multiply the numerator by the same factor, and read the hundredths as a percent. Three fresh fraction conversions follow, then percent-of and percentage changes. The existing quest and chapter IDs are preserved.

The worked example starts at 2/5 and explains why each fifth splits into 20 pieces. The existing decimals chapter remains the prerequisite bridge; percent teaching explicitly connects 40/100, 0.40 and 40%.

`Question.visual` is the unanswered problem. Optional `Question.solutionVisual` is used only by the explicitly opened explanation. A conversion prompt never uses `into: 100`: the fraction renderer computes and displays the equivalent numerator when `into` is supplied. Completed hundredths belong in teaching and worked solutions.

Percentage chapter practice now uses the existing Arcade Academy drills, under Percentages. Its generator covers conversions, percent-of and changes, without asking players to use a dial that is absent from typed practice. Existing fluency families remain recognized for save compatibility; the dedicated percentage practice family is added.

Before publishing percentage changes, verify:

- A fresh 2/5 conversion displays one source bar and no 40/100 answer.
- Fraction labels appear once, including explicit labels and empty-label fallback.
- Worked solutions name both 100 ÷ denominator and numerator × factor.
- Both quests build to 100 before independent conversions; those conversions use different fractions from the guided sequence.
- Percent-of and tariff prompt models contain no computed answer amount.
- The missing numerator table works on a narrow touch screen.
- Percentage Arcade answers feed the chapter's fluency family.
- Existing saves retain chapter and quest completion.

Run `ACADEMY=arithmetic npx vitest run src/engine/__tests__/percent-gradient.test.ts src/engine/__tests__/academy.test.ts src/engine/__tests__/academies.test.ts src/engine/__tests__/academy-kit.test.ts`, then `QUEST_BASE=/engineering-quest/ npm run build`.
