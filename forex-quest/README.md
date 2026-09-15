# Forex Quest — Currency Expedition 2.0

A complete twelve-world educational browser game in the Eng Quest family. Canonical source is `engineering-quest/public/forex-quest/` in Command Center. The existing Vite public copy includes it at `/quest/forex-quest/`. The static published copy lives in the public Engineering Quest repository at `forex-quest/`.

## Playable curriculum

36 first-principles lessons, 27 assessed skills, 90 authored decision cases with shuffled options, and 15 numerical generator families:

1. Currency Harbor — conversions, quote direction, instruments, market structure.
2. Execution District — pips, bid/ask costs, order and fill reasoning.
3. Risk Fortress — sizing, margin, exposure, planned versus realized loss.
4. Chart Observatory — returns, candles, trends, volatility, data conventions.
5. Central Bank Capital — surprises, expectations, policy, the impossible trinity.
6. Global Funding Network — forward pricing, CIP/UIP, basis, swaps, settlement.
7. Strategy Laboratory — expectancy, carry, momentum, mean reversion, testable chart narratives.
8. Crisis Archives — stress losses, 1992 sterling, 2015 franc, 2024 carry unwind, dollar swap lines.
9. Quantitative Academy — option net payoffs, Garman–Kohlhagen, Greeks, Dornbusch, Meese–Rogoff.
10. Market Microstructure — order imbalance, dealer risk, fragmentation, execution algorithms, VPIN debate.
11. Research Trials — RMSE, information timing, selection bias, out-of-sample testing.
12. Capstone Desk — correlated exposures and integrated decision evaluation.

This is an educational course and simulator, not a postgraduate degree, professional credential, or profitability guarantee. Lessons condense the concepts into teachable units; linked primary references allow deeper study.

## Flow and mastery

The same separation of content, pure learning logic, rendering, and answer-driven progression as Eng Quest is used, via a self-contained browser module matching the Sentence Forge integration.

- Learn what / why / worked example / rule; lesson exploration is separate from mastery.
- Practice numeric calculations or reasoned three-choice cases. Incorrect answers enter the notebook.
- Recency-weighted accuracy across 12 first attempts is capped by attempt and distinct-example counts. Repeating one example cannot exceed 50%. No speed requirement.
- Every world skill needs 70% before its challenge is available. Challenges 1–11 have 12 questions; the final challenge covers all 27 skills twice (54 questions). Passing requires at least 80% overall and at least two-thirds in every tested skill. Passed challenges unlock the next world. An unsuccessful repeat does not erase an earlier pass.
- Challenge feedback is deferred until its end. Practice has immediate explanations. These are authored educational assessments, not secure standardized examinations.
- Conquer mixes 10 questions. Adaptive practice biases weak and due skills. Review ladder: 10 minutes, 1, 3, 7, 14, 30, 60 days.
- Notebook repair: original + three distinct same-skill variations + a transfer question from a neighboring skill. The first four must be correct for a clean repair. Three clean repairs spaced now → 3 days → 7 additional days clear the card; early practice cannot advance it. A lapse resets clean progress. The fifth question reports transfer and feeds its own mastery.

## Applied systems

**Trading desk:** three synthetic 12-quote scenarios, EUR/USD in a USD account, $10,000 fresh balance, long/short entries, bid/ask execution, one position, stop gap handling, manual closure, observation-only completion, and saved journals. Planned stop risk uses an illustrative 1% budget; initial margin uses 20:1 and liquidation at quoted equity ≤50% of initial margin. These are scenario rules, not personal recommendations or universal broker terms. Gap fills can exceed planned loss. No partial fills, intratick path, commission, financing, or separate latency slippage. Positions close at scenario end; reload starts a fresh desk while retaining journals. Profit never awards learning mastery.

**Forward hedge builder:** matched-maturity simple-rate parity and three future-spot invoice comparisons. Explicitly excludes basis and costs; outcomes carry no probabilities.

**FX option workshop:** European Garman–Kohlhagen call/put, model forward, spot call delta, vega per one volatility percentage point, and spot stresses. Continuously compounded rates, constant volatility, no jumps or transaction costs. Boundary values at zero time/volatility are explicit; boundary delta is discontinuous. Normal CDF uses a polynomial approximation, checked against reference values and put-call parity.

**Strategy test bench:** seedable synthetic price data; momentum, mean reversion, no-trade benchmark; past-only signals and explicit total round-trip costs; training choice freezes before later data are shown. Trial count persists. Training ends at observation 70, holdout starts there without overlapping return intervals. Signal at entry i uses closes strictly before i. Each 10,000-EUR round trip enters i and exits i+1; there is no leverage, carry, commission beyond the displayed all-in cost, or intrainterval execution model. Synthetic results are not evidence of a real-market edge. New experiments are identified by seed; all repeated experimentation must be understood as selection.

**Order-flow observatory:** three equal-volume buckets illustrate signed and mean absolute imbalance. This is explicitly not a validated VPIN implementation, a probability of informed trading, or a crash forecast.

## Sources and integrity

The in-game field guide links BIS, CFTC, Federal Reserve, SNB, Bank of England, original Meese–Rogoff and backtest-overfitting research, the VPIN dispute, and AMD's documented Garman–Kohlhagen formulas. The supplied advanced report informs the syllabus, with corrected distinctions:

- UIP is not riskless arbitrage; a forward is not automatically an expected future spot.
- CIP wedges reflect frictions, not a universal collapse of all arbitrage relationships.
- Gross yen borrowing is not a direct carry-size estimate.
- VPIN prediction and “smart money” motives are not established universal facts.
- Pricing, explanation, forecasting, and trading profitability are separate evaluations.
- No current policy rates, legal leverage ceilings, historical price replays, or live quotes are fabricated. The desk and research series are labeled synthetic.

No remote scripts, advertising, analytics, subscriptions, or broker connections. All interface illustrations are original SVG geometry; icons are rendered from the included SVG. The system-font layout needs no external fonts.

## Persistence and installation

One local learner slot, autosave, JSON export/import with validation, version-1 save migration, and app-scoped offline caching after initial online load. Add to home screen using browser install/share controls. External reference links need internet. Progress is local to the browser and is not synchronized across devices. Export/import moves it. A service worker and manifest use relative paths and scope, keeping Eng Quest and Sentence Forge separate.

## Development

```sh
npm test
npm start
```

`npm start` serves the folder at http://localhost:5196/. The standalone browser test starts its own temporary HTTP server and needs Playwright plus Chromium:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright CHROME_PATH=/path/to/chromium node tests/browser.mjs
```

`QA_DIR` overrides `/tmp/forex-qa` for screenshots. Browser tests render icon PNGs from `icon.svg` and verify lesson routes, decision/numeric practice, spaced-repair flow, world challenge outcomes, journals, scenarios, four labs, mobile overflow, offline reload, and no uncaught errors. Engine tests cover all skills and decisions, mastery attainability, exact calculations, repair scheduling, migration, option reference values and parity, backtest cost accounting and holdout isolation, and execution risk. No parent Command Center dependency change is required.

## Named player profiles
Use Add your name to name the existing expedition. Player profiles lets other people create separate expeditions and switch between them. Profiles are local to the browser, are not authenticated accounts, and do not sync automatically. Existing legacy progress is retained and copied into the original profile on the first save. Export/import operates on the active player's progress; names remain local. No passwords or email addresses are collected.

## App updates
The app checks for updates on launch, return to the foreground, reconnection, and every five minutes while visible. A ready update appears in a top banner outside the game render tree. Update now saves current profile progress, activates the waiting worker, then reloads once. Unsubmitted answers and an open simulation trade are not persisted; the banner asks players to finish them first. Another tab activating an update shows a banner instead of forcing this tab to reload. A waiting worker can also activate naturally after all app tabs/windows close. Offline use stays on the cached release.

RELEASE REQUIREMENT: increment CACHE in sw.js on every deployment, even if only content changes. Publish all assets together. The worker caches the entire asset set using cache:reload before installing; do not call skipWaiting during install. Retain the ACTIVATE_UPDATE message contract. Register with updateViaCache:none. Browser caching/background scheduling means updates require a connection and may not appear instantly.
