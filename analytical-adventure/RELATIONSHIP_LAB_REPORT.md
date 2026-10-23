# Relationship Lab implementation and verification

Built October 23, 2026 inside the existing Analytical Adventure app.

## Implemented

- Six progressive levels, 43 authored source cases and additional changed-domain contexts. The final level contains ten unlabelled investigations spanning mathematics, physics, chemical/electrical engineering, biology, economics, everyday decisions, human behavior, scientific experiments, and mechanical systems.
- Six functional laboratory entry points: discovery sandbox, detective, prediction, cause-or-coincidence, systems thinking, and transfer.
- Concrete object sorting, classification, part/whole side counting, spatial placement, sequence construction, and observation/report/interpretation tasks. Drag interactions have selection/button alternatives. Transfer objects differ from source objects.
- Eighteen deterministic numerical/systems model families. Sliders and controls change actual outputs; observations populate a table and labelled graph. Feedback, resource ceilings, bottlenecks, accumulation, and shared resources have functional visual representations.
- Observe → Compare → Identify → Connect → Explain → Predict → Test → Revise → Transfer. Learners build rules, test against recorded observations, order mechanism fragments, commit numerical forecasts, choose experimental controls, execute tests, identify applicability limits, and revise rules. Earlier forecasts remain in saved history after revision.
- Meaning before names in guided work; independent and transfer assessments withhold the relationship label. A three-case baseline provides first performance evidence without granting mastery.
- Nine separate measures: observation, detection, classification, mechanism, prediction, experiment, counterexample, transfer, retention. Records include accuracy, confidence, support, active-time estimate, response, misconception signal, context, and timestamp. Optional prose is retained without automatic grading.
- First errors and corrective support remain recorded. A correct hidden-state guess unsupported by the learner's proposed rule cannot earn prediction credit. Equivalent authored rule forms can fit the data; a finite sequence explicitly demonstrates competing fitting rules.
- Recommended prerequisites, worked examples on request, guidance fading, independent probes, interleaved daily routes, due reviews, and a configurable mastery policy. Default review intervals 1/3/7/14 days and at least one real day for retention are pilot settings. A duplicate probe cannot inflate mastery.
- Today's Task, adjustable 5–25 minute targets (20 default), a shorter fatigue route, pause/resume, archived drafts when switching investigations, and a reasoning dashboard with independent/support counts, transfer, retention dates, gaps, misconception signals, and history.
- State is stored as `db.relationshipLab` within the existing local save. Existing lighthouse/greenhouse progress and AA private-code sync remain in place. No separate login or unrelated cloud storage was introduced.

## Verification performed

51 automated tests pass: the original investigation suite, original sync suite, lab math/simulation/sequencing/scoring/persistence/retention suite, and a new two-client lab sync test. A source and changed-domain path for every authored case reaches a correct conclusion. Tests specifically check inverse versus general negative behavior, quadratic versus exponential predictions, common-cause intervention, necessary versus sufficient conditions, ideal Ohm's law, mass-percent denominator, bottlenecks, delayed stock, hint caps, immutable forecasts, repeated probes, old saves, paused drafts, and true time-based retention eligibility.

Desktop Chromium preview: completed the full jar investigation through all nine stages; committed a prediction, reloaded, resumed the saved test, submitted limits/reflection, and confirmed the dashboard recorded guided credit without independent mastery.

390 px browser viewport: exercised causal observational/intervention controls and changed-domain shape sorting. The causal scene retained all six observations. The lab dialog measured 382.19 px wide with scrollWidth 365 px; no horizontal overflow. Rendered control audit found zero unlabelled inputs/selects/textareas in that scene. SVGs have text alternatives and tables retain exact measured values. Native dialog semantics, labelled controls, visible focus, keyboard-operated range inputs, and reduced-motion CSS are implemented.

Live existing sync service: two isolated synthetic clients created, linked, updated, and retrieved a lab investigation while preserving its samples. No existing user save codes were accessed.

The publication uses the existing GitHub main/gh-pages convention with current-head leases and preserves other app directories.

## Mathematical, scientific, and instructional review

Internal review checked all authored rows against their model rules and boundary conditions. Direct proportion is y=kx; an affine rule has a starting amount; simple inverse variation keeps xy constant and is distinguished from general negative association. Quadratic area and exponential repeated multiplication are compared at separating inputs. The fictional common-cause model separates observation from intervention and is not used as proof about real people. Series/ohmic examples state fixed-temperature/ideal-element conditions. Mixture percentage includes solute plus solvent in total mass. Queues, ceilings, and feedback models explicitly identify their simplifying assumptions.

Primary mathematical/scientific references:

- OpenStax Elementary Algebra, direct/inverse variation: https://openstax.org/books/elementary-algebra-2e/pages/8-9-use-direct-and-inverse-variation
- OpenStax Chemistry 2e, concentration units: https://openstax.org/books/chemistry-2e/pages/3-4-other-units-for-solution-concentrations
- OpenStax University Physics Volume 2, Ohm's law: https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law

Instructional sources, evidence boundaries, baseline design, and acceptance criteria are documented in RELATIONSHIP_LAB_PLAN.md. The UI connects concrete action, visible data, constructed rules, explanations, and unfamiliar-domain probes, rather than scoring vocabulary alone.

## Known limitations and remaining validation

- This is a content-complete functional first release, not a validated intervention. No learner-outcome study, general-intelligence gain, broad real-world transfer, or learning-effectiveness result is claimed.
- Mastery criteria, review intervals, fatigue routing, misconception inference, and session duration are design hypotheses. Mixed-age pilots, baseline/post comparisons, delayed real-user retention, independent human content review, and scoring-consistency checks remain.
- Structured rule/fragment responses support consistent scoring but cannot assess every valid free-form explanation. Optional reflection is ungraded. The app does not infer a learner's mental process with certainty from a response pattern.
- Model families and fresh probe values are finite. Exact repeated probes do not grant additional independent credit; exposure is preserved rather than treated as new evidence. Larger independently authored assessments would be needed before using scores for consequential judgments.
- Phone-width Chromium checks are not physical iPhone/Safari, screen-reader, or full WCAG certification. Those device/assistive-technology checks remain to be performed. All visuals use authored simplified models rather than full engineering simulation engines.
- Sync remains opt-in, requires a compatible browser with Web Locks, and inherits the existing service's 400 KB request limit and explicit conflict-choice behavior.

## Run checks

`npm test` in this directory runs all three test suites. `mobile-check.html` is a static internal responsive test harness, not a new game entry point. The application remains buildless; no package installation or API keys are needed to play.
