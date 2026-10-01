export const advancedWorlds=[
  {
    "id": "charts",
    "title": "Chart Observatory",
    "subtitle": "Describe evidence before predicting.",
    "icon": "⌁",
    "skills": [
      "returns",
      "chartjudgment"
    ],
    "mentor": "Academy mentor · Chart Observatory",
    "color": "#82b6ff",
    "lessons": [
      {
        "id": "charts0",
        "title": "Prices, returns, and candles",
        "what": "A candle summarizes open, high, low, and close over a chosen interval. A return scales the price change by the starting price.",
        "why": "The same absolute change has different meaning at different price levels. A candle does not reveal the order of every trade within it.",
        "example": "1.1000 to 1.1110 is (1.1110 / 1.1000 − 1) × 100 = 1%.",
        "rule": "Percent return = (end / start − 1) × 100.",
        "skill": "returns"
      },
      {
        "id": "charts1",
        "title": "Trends and ranges",
        "what": "A trend rule might compare a price to a moving average of previous observations. A range rule might examine distance from that average.",
        "why": "Define the lookback and timing before looking at results. Apparent support and resistance can fail.",
        "example": "A five-observation average uses five already known closes. It cannot use tomorrow’s close to decide today’s trade.",
        "rule": "A chart description is not a guaranteed forecast.",
        "skill": "chartjudgment"
      },
      {
        "id": "charts2",
        "title": "Volatility is not direction",
        "what": "Volatility describes variation in returns. Higher volatility does not by itself tell you whether the next return is positive.",
        "why": "Stops, exposure, and execution costs must be considered together when the market becomes less stable.",
        "example": "A price can swing widely up and down and finish close to where it started. Net change and volatility answer different questions.",
        "rule": "Separate trend, uncertainty, liquidity, and time horizon.",
        "skill": "chartjudgment"
      }
    ]
  },
  {
    "id": "macro",
    "title": "Central Bank Capital",
    "subtitle": "Read surprises, expectations, and policy.",
    "icon": "◎",
    "skills": [
      "surprise",
      "macrojudgment"
    ],
    "mentor": "Academy mentor · Central Bank Capital",
    "color": "#f4c57a",
    "lessons": [
      {
        "id": "macro0",
        "title": "Measure the surprise",
        "what": "A release is news relative to expectations. Subtract the stated consensus from the actual value; use percentage points for differences between percentage rates.",
        "why": "Actual inflation of 3% can be a downward surprise if 3.4% was expected.",
        "example": "Actual 3.0% minus expected 3.4% = −0.4 percentage points.",
        "rule": "Surprise = actual − expected. It is not a complete FX forecast.",
        "skill": "surprise"
      },
      {
        "id": "macro1",
        "title": "The policy transmission chain",
        "what": "Inflation, employment, and activity can affect expected monetary policy, yields, capital allocation, and exchange rates.",
        "why": "Markets respond to the expected path and risk environment, not just today’s policy rate.",
        "example": "A rate increase that was fully expected can produce a muted or opposite currency move if guidance changes.",
        "rule": "Compare expectations, announcement, revisions, and subsequent information.",
        "skill": "macrojudgment"
      },
      {
        "id": "macro2",
        "title": "Regimes and the impossible trinity",
        "what": "A country cannot fully combine a fixed exchange rate, unrestricted capital mobility, and independent monetary policy.",
        "why": "A peg changes how an economy absorbs shocks. Reserves, credibility, and domestic objectives all matter.",
        "example": "Under mobile capital and a defended peg, domestic policy may need to follow conditions abroad even during local weakness.",
        "rule": "Ask which policy objective or constraint is adjusting.",
        "skill": "macrojudgment"
      }
    ]
  },
  {
    "id": "funding",
    "title": "Global Funding Network",
    "subtitle": "Price a hedge and follow the funding.",
    "icon": "⇄",
    "skills": [
      "forward",
      "parityjudgment"
    ],
    "mentor": "Academy mentor · Global Funding Network",
    "color": "#64e8c4",
    "lessons": [
      {
        "id": "funding0",
        "title": "Price an outright forward",
        "what": "With S in domestic currency per foreign unit and matching simple annual rates, F = S × (1 + rd × T) / (1 + rf × T).",
        "why": "This covered-parity benchmark compares like maturities. Actual dealer prices include funding conditions and costs.",
        "example": "S=1.10, domestic 5%, foreign 3%, T=1 gives F≈1.12136 domestic per foreign.",
        "rule": "Always state quote direction, compounding convention, and maturity.",
        "skill": "forward"
      },
      {
        "id": "funding1",
        "title": "Covered versus uncovered",
        "what": "Covered parity uses a forward hedge. Uncovered parity concerns expected returns without that hedge and relies on additional assumptions.",
        "why": "Uncovered carry retains exchange-rate risk. Forward premiums do not automatically forecast future spot rates.",
        "example": "A high yield can be outweighed by depreciation of the investment currency.",
        "rule": "A hedged price relationship is different from an unhedged expectation.",
        "skill": "parityjudgment"
      },
      {
        "id": "funding2",
        "title": "Swaps, basis, and settlement",
        "what": "An FX swap exchanges currencies now and reverses them later. A currency swap generally exchanges longer-term cash flows. Basis reflects departures from a benchmark funding relationship.",
        "why": "Hedging demand and constrained dealer balance sheets can sustain wedges. Payment-versus-payment reduces principal settlement risk; it does not remove every risk.",
        "example": "A dollar borrower may compare direct dollar funding with foreign borrowing plus an FX swap.",
        "rule": "Separate funding, market risk, counterparty risk, and settlement risk.",
        "skill": "parityjudgment"
      }
    ]
  },
  {
    "id": "strategy",
    "title": "Strategy Laboratory",
    "subtitle": "Turn a story into a falsifiable rule.",
    "icon": "⚗",
    "skills": [
      "expectancy",
      "strategyjudgment"
    ],
    "mentor": "Academy mentor · Strategy Laboratory",
    "color": "#82b6ff",
    "lessons": [
      {
        "id": "strategy0",
        "title": "Calculate expectancy",
        "what": "Expected net P/L per trade = win probability × average win − loss probability × average loss − average costs.",
        "why": "Win rate alone omits payoff size and expenses. Estimates from a small sample are uncertain.",
        "example": "40% wins of $200 and 60% losses of $100, with $5 average costs: 80 − 60 − 5 = $15.",
        "rule": "Use net results and uncertainty, not just the percentage of wins.",
        "skill": "expectancy"
      },
      {
        "id": "strategy1",
        "title": "Carry, momentum, and mean reversion",
        "what": "Carry seeks yield differences, momentum follows past direction, and mean reversion trades deviations from a reference. Each needs explicit entries, exits, sizing, and costs.",
        "why": "Different regimes can reverse performance. Carry can lose abruptly during deleveraging.",
        "example": "Define a five-close signal today and execute next interval. Compare it with a flat benchmark and alternative rules.",
        "rule": "A strategy is a reproducible procedure with a failure condition.",
        "skill": "strategyjudgment"
      },
      {
        "id": "strategy2",
        "title": "Test chart narratives",
        "what": "Order blocks, liquidity sweeps, and Fibonacci zones can be encoded as rules and tested. A candle alone cannot prove motive or reveal all institutional orders.",
        "why": "Changing a drawing after seeing the result creates hindsight bias.",
        "example": "Fix the zone definition and transaction cost assumptions before evaluating later observations.",
        "rule": "Treat the explanation as a hypothesis until evidence supports it.",
        "skill": "strategyjudgment"
      }
    ]
  },
  {
    "id": "crisis",
    "title": "Crisis Archives",
    "subtitle": "Navigate gaps, pegs, and funding stress.",
    "icon": "◉",
    "skills": [
      "stress",
      "crisisjudgment"
    ],
    "mentor": "Academy mentor · Crisis Archives",
    "color": "#f4c57a",
    "lessons": [
      {
        "id": "crisis0",
        "title": "Measure a stress loss",
        "what": "A stress scenario asks what a specified adverse move would do to exposure. It is not a probability forecast.",
        "why": "Normal-period averages can miss discontinuous events and concentrated risks.",
        "example": "50,000 EUR with a USD account loses $500 on a 0.0100 fall before costs.",
        "rule": "Stress P/L = signed base units × price change in quote currency.",
        "skill": "stress"
      },
      {
        "id": "crisis1",
        "title": "When policy regimes change",
        "what": "The UK left the ERM in September 1992. The SNB removed the 1.20 CHF-per-EUR minimum in January 2015.",
        "why": "A political commitment is not an unconditional guarantee to market participants. Liquidity and executable prices can change sharply.",
        "example": "In the franc case, the minimum EUR/CHF quote limited franc strength. Removing it exposed positions built around that policy.",
        "rule": "Test the loss if a policy commitment or liquid market disappears.",
        "skill": "crisisjudgment"
      },
      {
        "id": "crisis2",
        "title": "Carry unwinds and liquidity backstops",
        "what": "August 2024 illustrates deleveraging and carry unwinds. Federal Reserve swap lines provide dollars to partner central banks, which distribute funding locally.",
        "why": "Swap lines address funding strains; they do not guarantee a trader’s profit or bail out every position.",
        "example": "A foreign central bank returns dollars at the original exchange rate under the swap agreement. It handles lending to its domestic institutions.",
        "rule": "Distinguish market losses from a shortage of funding currency.",
        "skill": "crisisjudgment"
      }
    ]
  },
  {
    "id": "quant",
    "title": "Quantitative Academy",
    "subtitle": "Understand what equations assume.",
    "icon": "∑",
    "skills": [
      "optionpayoff",
      "modeljudgment"
    ],
    "mentor": "Academy mentor · Quantitative Academy",
    "color": "#64e8c4",
    "lessons": [
      {
        "id": "quant0",
        "title": "Option payoff and premium",
        "what": "A call on foreign currency pays max(S − K, 0) in domestic currency per foreign unit at expiry. A put pays max(K − S, 0).",
        "why": "Payoff is not net profit: subtract the premium and other costs. Pricing before expiry also depends on time and uncertainty.",
        "example": "A EUR call with strike 1.10, terminal spot 1.15, and premium $0.02 per EUR has net expiry result $0.03 per EUR, ignoring financing.",
        "rule": "Differentiate payoff, price, and realized net P/L.",
        "skill": "optionpayoff"
      },
      {
        "id": "quant1",
        "title": "Garman–Kohlhagen and Greeks",
        "what": "For European FX options, C = S exp(−rfT) N(d1) − K exp(−rdT) N(d2). d1 = [ln(S/K)+(rd−rf+σ²/2)T]/(σ√T); d2=d1−σ√T.",
        "why": "The model assumes constant rates and volatility, continuous diffusion, and frictionless hedging. Smiles and jumps limit it.",
        "example": "Delta measures local spot sensitivity; vega measures volatility sensitivity. Theta is a derivative with respect to time passage, not a promise of a fixed daily loss.",
        "rule": "Use both rates, explicit quote units, and the model assumptions.",
        "skill": "modeljudgment"
      },
      {
        "id": "quant2",
        "title": "Overshooting and the forecast puzzle",
        "what": "Dornbusch links fast financial adjustment with sticky goods prices. Meese–Rogoff showed difficult out-of-sample competition with a random-walk benchmark.",
        "why": "A coherent explanatory model need not forecast short-run FX well. Failure to beat a benchmark does not prove fundamentals never matter.",
        "example": "After a monetary expansion in the model, an initial depreciation can exceed the long-run change and then partly reverse.",
        "rule": "Separate explanation, risk-neutral pricing, and real-world forecasting.",
        "skill": "modeljudgment"
      }
    ]
  },
  {
    "id": "micro",
    "title": "Market Microstructure",
    "subtitle": "Follow orders, inventory, and liquidity.",
    "icon": "⋈",
    "skills": [
      "imbalance",
      "microjudgment"
    ],
    "mentor": "Academy mentor · Market Microstructure",
    "color": "#82b6ff",
    "lessons": [
      {
        "id": "micro0",
        "title": "Measure order imbalance",
        "what": "A simple signed imbalance is (buy-initiated volume − sell-initiated volume) / total classified volume.",
        "why": "This describes the dataset and classification used. A broker feed is not all global FX activity.",
        "example": "Buy 600, sell 400: (600−400)/1000 = 20%. This is not VPIN or a crash probability.",
        "rule": "State the data coverage, sign convention, and classification method.",
        "skill": "imbalance"
      },
      {
        "id": "micro1",
        "title": "Dealers face adverse selection",
        "what": "A liquidity provider posts prices and bears inventory and adverse-selection risk. Informed or faster flow can make quoted prices stale.",
        "why": "Spreads compensate for several costs and risks, not just a desire for profit. FX execution occurs across many venues and bilateral relationships.",
        "example": "Selling before a price increase can hurt a dealer’s position; it does not imply every buyer possessed illegal information.",
        "rule": "Follow both information risk and inventory exposure.",
        "skill": "microjudgment"
      },
      {
        "id": "micro2",
        "title": "Last look, algorithms, and VPIN",
        "what": "Execution algorithms split orders across time or venues. Some providers use disclosed last-look procedures. VPIN groups activity by volume to study order-flow imbalance, but its predictive claims are debated.",
        "why": "A useful research metric is not a universal warning siren. Classification errors and market design affect interpretation.",
        "example": "A toy bucket with mostly buys can show imbalance without proving informed trading or a coming crash.",
        "rule": "Avoid equating an indicator with a cause, a probability, or complete market visibility.",
        "skill": "microjudgment"
      }
    ]
  },
  {
    "id": "research",
    "title": "Research Trials",
    "subtitle": "Challenge the result before trusting it.",
    "icon": "⊞",
    "skills": [
      "rmse",
      "researchjudgment"
    ],
    "mentor": "Academy mentor · Research Trials",
    "color": "#f4c57a",
    "lessons": [
      {
        "id": "research0",
        "title": "Score a forecast",
        "what": "Root mean squared error is the square root of the average squared forecast error. It has the same units as the forecasted variable.",
        "why": "A directional hit rate and RMSE answer different questions; neither alone establishes net trading profit.",
        "example": "Errors of 3 and 4 pips give RMSE √((9+16)/2) ≈ 3.54 pips.",
        "rule": "Compare the same observations, horizon, and units.",
        "skill": "rmse"
      },
      {
        "id": "research1",
        "title": "Keep the future out",
        "what": "Training chooses a model. Validation helps select it. A held-out chronological period evaluates a frozen choice.",
        "why": "Repeatedly examining a holdout contaminates it. Time-series dependencies make random shuffling potentially misleading.",
        "example": "Choose a rule using the first segment, freeze it, then reveal its result on later data. Record every attempt.",
        "rule": "Data timestamps and all attempted rules belong in the research record.",
        "skill": "researchjudgment"
      },
      {
        "id": "research2",
        "title": "Uncertainty and reproducibility",
        "what": "Short samples and many searched rules create false discoveries. Confidence intervals, sensitivity tests, and replication help evaluate robustness.",
        "why": "An attractive curve can come from chance, selection, or leakage. Synthetic teaching data cannot prove a market edge.",
        "example": "If the best of many random rules looks excellent only on training data, inspect selection bias before celebrating.",
        "rule": "Record costs, benchmarks, drawdowns, trial count, and limitations.",
        "skill": "researchjudgment"
      }
    ]
  },
  {
    "id": "capstone",
    "title": "Capstone Desk",
    "subtitle": "Defend a complete trading process.",
    "icon": "✦",
    "skills": [
      "portfolio",
      "capstonejudgment"
    ],
    "mentor": "Academy mentor · Capstone Desk",
    "color": "#64e8c4",
    "lessons": [
      {
        "id": "capstone0",
        "title": "Aggregate currency exposure",
        "what": "Portfolio risk depends on shared currency exposures, not merely the number of tickets. In a specified scenario, sum the P/L of each position.",
        "why": "Several positions can express the same dollar view. A single-position stop does not cap whole-portfolio stress losses.",
        "example": "Long 10,000 EUR/USD losing $100 and long 10,000 GBP/USD losing $150 produce a combined −$250.",
        "rule": "State the joint scenario and sum exposures consistently.",
        "skill": "portfolio"
      },
      {
        "id": "capstone1",
        "title": "The complete decision record",
        "what": "A plan names the instrument, evidence, alternative explanation, size, costs, invalidation condition, and review horizon.",
        "why": "A journal written only after the result invites hindsight. A plan can be coherent and still fail.",
        "example": "Before an uncertain release, compare a reduced exposure with no trade and explain the consequences.",
        "rule": "Judge the process using information available at the decision time.",
        "skill": "capstonejudgment"
      },
      {
        "id": "capstone2",
        "title": "Restore the network",
        "what": "The final challenge combines calculations, macro interpretation, hedging, execution, models, and evidence evaluation.",
        "why": "Course completion demonstrates performance on these educational tasks. It is not a professional credential or a forecast of real-money success.",
        "example": "Explain a forward hedge, detect leaked data, calculate a gap loss, and identify when evidence is insufficient.",
        "rule": "Keep learning, test uncertainty, and separate knowledge from market outcomes.",
        "skill": "capstonejudgment"
      }
    ]
  }
];
export const decisions={
  "chartjudgment": [
    [
      "A candle has open 1.10, high 1.12, low 1.09, close 1.11. Which fact is known?",
      "The close exceeded the open",
      "The low occurred before the high",
      "The next candle will rise",
      "OHLC establishes the endpoints and extremes, not the order of intrabar events or the next return."
    ],
    [
      "A rising five-day average is visible. What can you conclude?",
      "Recent prices satisfy a historical trend description",
      "Tomorrow must be higher",
      "A central bank placed an order",
      "A moving average summarizes past observations. It does not identify hidden orders or determine the future."
    ],
    [
      "Your 20-day average includes tomorrow’s close. What is wrong?",
      "Future information leaked into the signal",
      "The lookback is too short by definition",
      "Nothing if the profit is high",
      "Signals must use only information available when the decision is made."
    ],
    [
      "An asset rises 1%, then falls 1%. What is its cumulative direction?",
      "Slightly negative",
      "Exactly unchanged",
      "Positive by 2%",
      "1.01 × 0.99 = 0.9999, a 0.01% loss. Compound returns multiply."
    ],
    [
      "A volatility estimate doubles. Which statement is justified?",
      "The measured variation increased",
      "The next price must fall",
      "The spread must stay unchanged",
      "Volatility has magnitude, not a guaranteed direction. Execution conditions must be observed separately."
    ],
    [
      "A support level held three times. How should a rule use it?",
      "As a testable condition with an invalidation rule",
      "As a guaranteed price floor",
      "As proof of all institutional orders",
      "A few examples do not establish a guarantee or a universal mechanism."
    ],
    [
      "Two brokers show different candle lows. What should you investigate?",
      "Venue quotes, timestamps, and bid/ask conventions",
      "Which chart predicts the future",
      "Whether all FX has one consolidated tape",
      "Spot FX is fragmented. Data source and price conventions can differ."
    ],
    [
      "You compare a one-minute chart with a daily strategy. What must match?",
      "The signal and evaluation time horizons",
      "Only the chart colors",
      "The number of profitable candles",
      "A strategy defined on daily closes cannot be evaluated by selecting favorable intraminute hindsight."
    ]
  ],
  "macrojudgment": [
    [
      "Inflation is 3%, versus 3.4% expected. What is established?",
      "Inflation undershot this expectation",
      "The currency must fall",
      "Inflation is negative",
      "The release is below the given forecast, but still positive inflation. Currency response depends on more information."
    ],
    [
      "A fully expected rate hike occurs, but guidance is softer. Why might the currency fall?",
      "The expected future rate path may have shifted lower",
      "Rate hikes always weaken currencies",
      "The announcement contains no new information",
      "The surprise can be in guidance rather than the current rate decision."
    ],
    [
      "What is incompatible with a strict peg and unrestricted capital mobility?",
      "Fully independent monetary policy",
      "Cross-border trade",
      "Publishing economic data",
      "The impossible trinity limits the simultaneous policy combination, not trade or publication."
    ],
    [
      "A payroll release is revised next month. Which value belongs in an honest earlier backtest?",
      "The vintage available at the earlier decision",
      "The final revised value only",
      "Whichever makes the strategy profitable",
      "Using later revisions introduces information that was unavailable at trade time."
    ],
    [
      "A country has a higher interest rate. Is appreciation assured?",
      "No, inflation, risk, and expectations also matter",
      "Yes, yields dictate every move",
      "Yes, unless the market is closed",
      "A rate differential is one input; its risk premium and expected change are uncertain."
    ],
    [
      "During a growth scare, a funding currency strengthens as positions close. What can explain it?",
      "Borrowers buying the currency to repay",
      "A universal inflation rule",
      "Guaranteed safe-haven behavior forever",
      "Position unwinds can generate demand for the funding currency; this is context dependent."
    ],
    [
      "Which release comparison is most informative?",
      "Actual, expectation, prior value, and revisions",
      "Actual value alone in every case",
      "The largest headline font",
      "Surprise and information vintage matter alongside the level."
    ],
    [
      "A higher nominal rate accompanies even higher expected inflation. What should you inspect?",
      "Expected real returns and risk",
      "Nominal rate alone",
      "The currency symbol",
      "Nominal yields and inflation jointly affect expected real returns, with uncertainty remaining."
    ]
  ],
  "parityjudgment": [
    [
      "A US importer owes euros in three months. Which hedge fixes the future dollar payment, subject to contract terms?",
      "Buy the needed euros forward",
      "Sell the needed euros forward",
      "Borrow more dollars without exchanging or hedging",
      "The importer needs future EUR, so buying EUR forward locks a contractual USD/EUR rate."
    ],
    [
      "A forward rate is above spot. What alone follows?",
      "The forward contract prices foreign currency higher in these quote units",
      "The future spot is guaranteed higher",
      "An unhedged profit is riskless",
      "A forward price is an agreed exchange price, not certainty about realized spot."
    ],
    [
      "Borrow low-yield currency and buy high-yield currency without a hedge. Which risk remains?",
      "Exchange-rate movement can erase carry",
      "There is no risk under UIP",
      "Only a calendar-display risk",
      "UIP is not a mechanism that removes uncertainty from an uncovered trade."
    ],
    [
      "Why can a covered-parity wedge persist?",
      "Balance-sheet costs and hedging demand can limit arbitrage",
      "All contracts are always identical and frictionless",
      "Because spot prices do not exist",
      "Real funding access and constraints differ from frictionless textbook assumptions."
    ],
    [
      "Which description fits an FX swap?",
      "An exchange now and a reverse exchange later",
      "A perpetual equity dividend",
      "An option with no obligation",
      "The two currency exchanges manage funding across dates. An option gives a contingent right."
    ],
    [
      "Payment-versus-payment primarily addresses which risk?",
      "Paying one currency but not receiving the other principal",
      "All future currency depreciation",
      "Every counterparty default loss",
      "PvP coordinates principal exchange; other exposures and operational risks remain."
    ],
    [
      "A negative dollar basis is quoted by a dealer. What must be checked first?",
      "The convention, currencies, and leg receiving the spread",
      "Assume every convention has the same sign",
      "Treat it as a next-day dollar forecast",
      "Basis signs depend on how the trade and spread are quoted."
    ],
    [
      "You compare three-month foreign funding with one-year domestic funding. Is that a clean CIP comparison?",
      "No, align maturities and conventions",
      "Yes, rates have no time dimension",
      "Yes, if the currency names match",
      "Parity compares appropriately matched cash flows, not arbitrary interest rates."
    ]
  ],
  "strategyjudgment": [
    [
      "A system wins 90% of trades. What is still needed?",
      "Loss size, win size, costs, and sample uncertainty",
      "Nothing: profitability is established",
      "Only a more colorful chart",
      "A few large losses or costs can outweigh many small wins."
    ],
    [
      "A carry position earns interest but loses more on FX. What is the outcome?",
      "A negative total return is possible",
      "Carry prevents capital losses",
      "The FX loss should be ignored",
      "Income and exchange-rate P/L both belong in total return."
    ],
    [
      "Which rule is reproducible?",
      "Use the last five known closes, enter next interval, apply fixed exit and cost rules",
      "Buy when the chart feels institutional",
      "Redraw the zone after every loss",
      "A reproducible rule specifies inputs, timing, actions, and evaluation."
    ],
    [
      "A breakout failed yesterday. Does that disprove every breakout strategy?",
      "No, evaluate a defined rule over appropriate evidence",
      "Yes, one loss settles it",
      "No, losses should be deleted",
      "Neither isolated wins nor isolated losses settle a strategy’s expected performance."
    ],
    [
      "An order-block chart allegedly proves a bank’s hidden order. What is missing?",
      "Evidence beyond the candle pattern",
      "A Fibonacci color theme",
      "More leverage",
      "The pattern is observable; the claimed hidden actor and motive are not established by it."
    ],
    [
      "A strategy is profitable only before spread and financing. What is the relevant result?",
      "Its net result under realistic costs",
      "Gross profit alone",
      "Only the winning trades",
      "Costs are part of the strategy’s economic result."
    ],
    [
      "You repeatedly change parameters after viewing the test period. What happens?",
      "That period becomes part of model selection",
      "It stays untouched out-of-sample forever",
      "It becomes a guaranteed forecast",
      "Repeated inspection uses the test data to choose the strategy."
    ],
    [
      "When should no-trade be permitted?",
      "When the defined evidence or execution conditions fail",
      "Never, activity itself proves skill",
      "Only after every dollar is lost",
      "A valid process can decide not to take exposure."
    ]
  ],
  "crisisjudgment": [
    [
      "A currency peg exists. What assumption is unsafe?",
      "The policy can never change",
      "The peg affects current market incentives",
      "The policy has economic trade-offs",
      "Policy regimes can change even after participants have relied on them."
    ],
    [
      "The SNB’s 1.20 CHF per EUR minimum limited which move?",
      "Further franc appreciation through a lower EUR/CHF quote",
      "All franc depreciation",
      "All changes in euro interest rates",
      "A lower CHF-per-EUR quote means a stronger franc."
    ],
    [
      "A funding currency appreciates during a carry unwind. Who may need to buy it?",
      "Borrowers repaying funding-currency debt",
      "Only tourists",
      "Nobody because carry is covered",
      "Closing short funding exposure can create demand and amplify a move."
    ],
    [
      "Your ordinary stop is inside a price gap. What can happen?",
      "Fill at a worse available executable quote",
      "Guaranteed fill at the trigger",
      "The loss becomes zero",
      "A stop instruction is not a guaranteed-price contract."
    ],
    [
      "Who is the Fed’s direct counterparty in a central-bank dollar swap line?",
      "The partner central bank",
      "Every foreign retail trader",
      "Each foreign commercial bank individually",
      "The partner central bank distributes dollars and bears its downstream lending exposure."
    ],
    [
      "Cross-border yen borrowing is $X. Does that equal speculative carry size?",
      "No, purposes and coverage differ",
      "Yes, all borrowing is speculation",
      "Yes, hedging never uses borrowing",
      "Carry measurement is difficult and gross borrowing is not a direct proxy for every speculative position."
    ],
    [
      "Which stress test captures a hidden concentration?",
      "Several USD-related trades move adversely together",
      "Every pair is assumed independent",
      "Stops always fill perfectly",
      "Correlated exposures can lose together even when pair names differ."
    ],
    [
      "What does a liquidity backstop primarily seek to ease?",
      "Funding-market strain",
      "Every equity-price decline",
      "A retail strategy’s losing streak",
      "A liquidity facility supports funding access, not a guaranteed asset valuation."
    ]
  ],
  "modeljudgment": [
    [
      "An option payoff is $100 and the premium paid was $30. Ignoring other costs, which is profit?",
      "$70",
      "$100",
      "$130",
      "The purchased right cost money: profit is payoff less premium."
    ],
    [
      "What is the foreign rate’s role in Garman–Kohlhagen?",
      "A yield-like discount on the spot term",
      "The domestic strike itself",
      "A guaranteed realized return for the option buyer",
      "Holding foreign currency can earn the foreign rate; the model adjusts the spot term accordingly."
    ],
    [
      "Which violates the constant-volatility diffusion assumptions?",
      "A discontinuous jump with changing implied volatility",
      "A fixed strike",
      "A European expiry date",
      "Real jumps and volatility smiles motivate richer models and stress analysis."
    ],
    [
      "Delta is approximately 0.5. What is its local meaning?",
      "Option value changes about 0.5 quote units per one-unit spot change, per base unit",
      "A guaranteed 50% chance of profit",
      "Half the premium is refunded",
      "Delta is a sensitivity; its interpretation depends on convention and small changes."
    ],
    [
      "Why can overshooting occur in Dornbusch’s model?",
      "Financial prices adjust faster than sticky goods prices",
      "All prices adjust identically and instantly",
      "The central bank fixes every future trade",
      "Differing adjustment speeds are central to the model’s mechanism."
    ],
    [
      "What is a lesson of Meese–Rogoff?",
      "Test forecasts out of sample against simple benchmarks",
      "Fundamentals can never matter",
      "Any complex model must beat a random walk",
      "A model’s explanatory elegance does not establish forecasting superiority."
    ],
    [
      "Is a risk-neutral forward drift necessarily the actual expected currency return?",
      "No, pricing and physical expectations differ",
      "Yes, by definition in every market",
      "Yes, if an option is European",
      "Risk premia and model assumptions separate pricing measures from real-world expectations."
    ],
    [
      "A new machine-learning FX paper beats a benchmark. What follows?",
      "Replicate, inspect data timing, costs, and uncertainty",
      "Retail profits are guaranteed",
      "Old benchmarks can be omitted forever",
      "A research finding is evidence to examine, not an unconditional trading promise."
    ]
  ],
  "microjudgment": [
    [
      "A dealer sells just before price rises. Which risk is illustrated?",
      "Adverse selection",
      "Guaranteed riskless spread income",
      "A dividend payment",
      "Liquidity provision can lose when the next price moves against the filled side."
    ],
    [
      "Your retail platform’s volume increases. What can be claimed safely?",
      "Activity increased under that feed’s volume definition",
      "All global FX volume is known",
      "All activity is informed",
      "Feed coverage and whether volume means ticks or transactions must be identified."
    ],
    [
      "What is an execution algorithm designed to do?",
      "Implement an order over time or venues under rules",
      "Guarantee a correct macro forecast",
      "Eliminate every market impact",
      "Execution methods manage implementation; they do not guarantee investment alpha."
    ],
    [
      "A high order imbalance appears. What remains unknown?",
      "Whether it reflects informed flow or predicts a crash",
      "The arithmetic imbalance",
      "That classified buy and sell totals differ",
      "Imbalance is descriptive; causal and predictive claims require evidence."
    ],
    [
      "Is VPIN a settled universal crash predictor?",
      "No, its findings and interpretation are disputed",
      "Yes, all dealers must use it",
      "Yes, it equals an exact default probability",
      "The curriculum treats the VPIN literature as a research debate."
    ],
    [
      "A market maker holds excess long inventory. What may influence quotes?",
      "Inventory management as well as information risk",
      "Only the national inflation rate",
      "Nothing, spreads are immutable",
      "Inventory and execution conditions can affect a dealer’s willingness to quote."
    ],
    [
      "What should a client inspect about last look?",
      "Provider disclosures, checks, timing, and rejection behavior",
      "Assume every quote is unconditionally firm",
      "Only the chart theme",
      "Last-look practices affect execution and should be understood from actual terms and data."
    ],
    [
      "What does an aggregate midpoint chart hide?",
      "Executable spreads and venue-level conditions",
      "Its own plotted values",
      "Its displayed time axis",
      "A midpoint is not necessarily a price at which the client can trade."
    ]
  ],
  "researchjudgment": [
    [
      "A backtest uses next day’s close to enter today. Which flaw dominates?",
      "Look-ahead bias",
      "Too little leverage",
      "Too many losing trades",
      "The decision uses future information. Fix timing before interpreting returns."
    ],
    [
      "You choose the best of 1,000 rules. What must evaluation account for?",
      "Multiple testing and selection bias",
      "Only the best equity curve",
      "Only the final rule name",
      "Searching many rules increases the chance of selecting noise."
    ],
    [
      "A holdout is checked after every parameter change. What is it becoming?",
      "Validation or training information",
      "Permanently untouched evidence",
      "A live account",
      "Repeated feedback influences selection, so it is no longer a pristine final test."
    ],
    [
      "A model has lower RMSE. Does net profitability follow?",
      "No, trading rules, costs, and exposure still matter",
      "Yes, always",
      "Only if the chart is daily",
      "Forecast accuracy and trading economics are related but distinct evaluations."
    ],
    [
      "Ten trades were profitable. What is missing?",
      "An adequate uncertainty and robustness assessment",
      "Nothing, ten is universal proof",
      "Only a larger font",
      "A short favorable sample may be luck or a narrow regime."
    ],
    [
      "Which benchmark belongs in a toy directional test?",
      "A flat no-trade result and a clearly defined alternative",
      "Only the most profitable selected model",
      "An unavailable future price",
      "A benchmark makes opportunity cost and added value explicit."
    ],
    [
      "A data vendor revises old values. How do you avoid hindsight?",
      "Use values available at each historical decision time",
      "Use the newest values for every past decision",
      "Delete release dates",
      "Point-in-time data prevents revisions from entering earlier signals."
    ],
    [
      "How should a failed test be handled?",
      "Preserve it in the trial record",
      "Delete it before reporting performance",
      "Rename it as a training success",
      "Complete trial records reduce selective reporting and aid replication."
    ]
  ],
  "capstonejudgment": [
    [
      "Two different pairs are both long against USD. What is the shared exposure?",
      "Both are short USD in the currency legs",
      "They are automatically independent",
      "They perfectly hedge each other",
      "Different base currencies do not remove the common short-dollar exposure."
    ],
    [
      "A profitable trade violated your predefined size limit. How should it be scored?",
      "As a process breach despite the profit",
      "As proof the limit is unnecessary",
      "As guaranteed mastery",
      "Outcome and process quality must be evaluated separately."
    ],
    [
      "An importer needs known euros on a future date. What is the primary hedge objective?",
      "Reduce uncertainty of the domestic-currency payment",
      "Maximize speculative profit at all costs",
      "Predict the exact future spot",
      "Hedging starts from a business exposure and objective."
    ],
    [
      "A trade plan is written after the outcome. What weakness arises?",
      "Hindsight can alter the stated reasoning",
      "It becomes more independent",
      "It proves the original forecast",
      "The pre-decision record is needed to evaluate original judgment."
    ],
    [
      "A simulated course has been completed. What does that establish?",
      "Completion of these educational assessments",
      "Guaranteed real-money profitability",
      "Professional authorization to advise clients",
      "A learning milestone is not a performance guarantee or professional license."
    ],
    [
      "Costs are unknown and an announcement is imminent. Which decision can be defensible?",
      "Wait and state what information is missing",
      "Increase size to compensate for uncertainty",
      "Assume zero costs",
      "No-trade is valid when the decision conditions are not met."
    ],
    [
      "A model and stress scenario disagree. What is the useful next step?",
      "Inspect assumptions and quantify the exposure under both",
      "Ignore stress if average return looks good",
      "Treat the model as certain",
      "Models and stress tests address different aspects of uncertain outcomes."
    ],
    [
      "What belongs in the final research handoff?",
      "Rules, data timing, costs, all trials, results, and limitations",
      "Only a winning screenshot",
      "Only a win-rate percentage",
      "A complete record allows someone else to reproduce and challenge the result."
    ]
  ],
  "quotejudgment": [
    [
      "EUR/USD rises. Which relative currency strengthens?",
      "EUR against USD",
      "USD against EUR",
      "Both by the same percentage",
      "More USD are required for each EUR."
    ],
    [
      "EUR/USD is 1.10. What is one base unit?",
      "One euro",
      "One dollar",
      "One pip",
      "The first currency is the base; the quote states USD per EUR."
    ],
    [
      "A US company buys euros for immediate use. Which instrument best describes the exchange?",
      "Spot exchange",
      "An equity option",
      "A perpetual bond",
      "Spot is the immediate currency-exchange category, subject to actual settlement conventions."
    ],
    [
      "A forward contract is primarily distinguished by what?",
      "An exchange agreed now for a future date",
      "A guaranteed trading profit",
      "No obligation to exchange",
      "A forward creates a future contractual exchange obligation."
    ],
    [
      "Global currency participation percentages sum to about 200%. Why?",
      "Each transaction has two currency sides",
      "Every trade is an error",
      "Every currency has 100% participation",
      "Counting both currency sides makes total participation 200%."
    ],
    [
      "Where is the complete centralized global spot FX order book?",
      "There is no single complete centralized book",
      "Inside every retail chart",
      "At one stock exchange",
      "Spot FX is traded across multiple dealers and venues."
    ]
  ],
  "executionjudgment": [
    [
      "You buy the base currency. Which side applies?",
      "Ask",
      "Bid",
      "Yesterday’s close",
      "The ask is the dealer’s offered selling price for the base currency."
    ],
    [
      "You sell the base currency. Which side applies?",
      "Bid",
      "Ask",
      "A future midpoint",
      "The bid is the offered buying price for the base currency."
    ],
    [
      "Does an ordinary stop guarantee its trigger price?",
      "No",
      "Yes",
      "Only if the trader is confident",
      "Gaps and available liquidity can produce different execution prices."
    ],
    [
      "A limit order sets a favorable price boundary. What remains uncertain?",
      "Whether it fills",
      "The requested limit",
      "Its submitted direction",
      "A price limit does not guarantee execution."
    ],
    [
      "Which can add to spread costs?",
      "Commission and overnight financing",
      "Only chart colors",
      "Nothing ever",
      "Actual fee and financing schedules affect net results."
    ],
    [
      "EUR/USD quotes have five decimal places. What does the fifth often represent?",
      "A fractional pip",
      "One whole dollar",
      "A fixed profit",
      "Conventional EUR/USD pips are 0.0001; finer quoting can use tenths of a pip."
    ]
  ],
  "riskjudgment": [
    [
      "Initial margin is best described as what?",
      "Collateral supporting exposure",
      "The maximum possible loss",
      "Guaranteed interest income",
      "Margin is a requirement, not a loss ceiling."
    ],
    [
      "What happens to risk when units double with the same price move?",
      "Cash P/L magnitude doubles before nonlinear costs",
      "It stays unchanged",
      "Losses become impossible",
      "For a linear spot exposure, cash P/L scales with units."
    ],
    [
      "What is equity in the simple desk model?",
      "Balance plus unrealized P/L",
      "Only initial margin",
      "Only gross notional",
      "Equity includes marked open-position gains and losses."
    ],
    [
      "A planned 1% stop loss gaps to a larger loss. Is that possible?",
      "Yes",
      "No, percentages guarantee fills",
      "Only with options",
      "Planned stop risk is not a guaranteed execution loss bound."
    ],
    [
      "Which choice reduces directional exposure?",
      "Reduce position units",
      "Increase leverage while keeping units fixed",
      "Hide the P/L display",
      "Reducing units reduces linear sensitivity to price moves."
    ],
    [
      "A trader makes money by breaking a risk rule. What is demonstrated?",
      "A favorable outcome with a process breach",
      "A reliable edge",
      "A valid reason to remove all limits",
      "A single outcome does not validate the decision process."
    ]
  ]
};
