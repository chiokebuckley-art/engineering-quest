# Relationship Lab: audit, design, acceptance

## Baseline audit (2026-10-23)

GitHub main: 363405eaabd4148063e90842ab871f3f57db8a70. Publication branch: gh-pages, 5827d2b1557b78664adb955982cf0e11d86c1c37. Local tracked files match the current application blobs. No repository AGENTS.md was found in the remote tree. Existing 26 tests pass.

The application is buildless ES modules: app.js owns the home/investigation screens; engine.js provides the two deterministic cases; scene.js renders SVG; content.js contains mission definitions. The existing six-dimension rubric assesses lighthouse/greenhouse cases, not a full relationship curriculum. Retain it and introduce nine separate lab skill measures. Reuse typography, dialog conventions, narration, reduced motion, and the existing AA code sync protocol. Keep lab state inside the existing db so the original local save and cloud envelope carry it. Keep credentials separate. Deploy additive changes to main and gh-pages using current-head leases.

## Modules and implementation sequence

1. Authored curriculum and model catalog, with domain/assumption boundaries.
2. Deterministic simulators and relationship/rule evaluation.
3. Versioned attempts, stage transitions, baseline, mastery, review scheduling, daily planner, and analytics.
4. Visual interactive workspace and accessible object tasks, prediction lock, experiment comparison, rule construction, explanation chains, and counterexamples.
5. Home/Today's Task integration and validated optional lab persistence in the existing cloud envelope.
6. Simulation/content/scoring/retention/sync/accessibility tests and desktop/mobile browser checks, then publication.

## Assessment design

Baseline: three unlabelled investigations from distinct domains, without teaching first; no baseline score confers mastery. Independent attempts use fresh input values and must predict, test, explain, and identify a boundary. Transfer uses a different domain with the relationship name withheld. Repeated contexts/inputs cannot count as new independent evidence. A full fresh session can include multiple valid rule candidates; finite observations do not establish a unique mathematical rule.

Nine dimensions: observation, detection, classification, mechanism, prediction, experimentation, counterexample, transfer, retention. Structured constructions determine scores; optional free text is retained for reflection, never automatically claimed to demonstrate understanding. Hints and worked examples mark the attempt supported. First mistakes remain recorded after correction. Confidence and elapsed active time are diagnostic only.

Initial configurable thresholds: two successful independent investigations on different probes, a successful new-domain transfer, and independent delayed retrieval after at least one day before retained mastery. Review intervals 1, 3, 7, 14 days are pilot choices. Availability of an exercise is not proof of mastery. No time-only rewards, no IQ or broad-transfer claims. Level advancement is based on multiple skill records; all levels remain manually explorable with a prerequisite recommendation.

## Acceptance gates

- All six levels have authored manipulable instruction and independent practice, including a hidden-label multi-domain final level.
- Numerical models distinguish y=kx, y=mx+b, y=k/x, general negative association, quadratic and exponential growth. Units and fixed conditions are explicit.
- Causal observational and intervention data differ where a common cause is modeled; a plausible story alone is not proof.
- Objects can be classified, reordered, and moved using taps/keyboard as well as drag operations.
- Predictions are immutable after commitment; experiments preserve previous trials; revisions do not erase mistakes.
- Guided success cannot confer independent mastery. Duplicate probes cannot inflate mastery. Transfer and delayed retention are independently measured.
- Local reload, optional cloud round-trip, interrupted sessions, and old saves preserve state. Unknown lab schema fails validation rather than dropping work.
- Existing tests remain green; model, sequencing, scoring, persistence, and accessibility checks pass.
- Production desktop/mobile checks must be reported accurately; if the preview environment blocks them, report that gate unverified rather than calling the whole acceptance list complete.

## Research-to-design rationale

IES practice guide (2007): https://ies.ed.gov/ncee/wwc/PracticeGuide/1 — supports spacing, connecting concrete/abstract representations, alternating worked examples and problems, and explanatory questions. Evidence strength differs by recommendation.

Gentner, Loewenstein & Thompson (2003): https://www.kellogg.northwestern.edu/academics-research/research/detail/2003/learning-and-transfer-a-general-role-for-analogical-encoding — comparison support improved abstraction/transfer in the studied negotiation tasks; not evidence of universal transfer from this app. Use contrasting source/target scenes and ask for structural mapping.

Collins, Brown & Holum (1991): https://www.psy.lmu.de/isls-naples/intro/all-webinars/collins/cognitive-apprenticeship.pdf — modeling/coaching/scaffolding/fading as an instructional framework. Make a worked reasoning path inspectable, then remove it in independent trials.

Sweller (1988): https://www.sciencedirect.com/science/article/pii/0364021388900237 — cognitive-load research motivates one decision per stage and explicit examples for novices, not an assertion of a measured load reduction in this product.

Klahr & Nigam (2004): https://pubmed.ncbi.nlm.nih.gov/15447636/ — research on control-of-variables instruction and transfer motivates guided experimentation rather than unsupported discovery alone.

Butler et al. (2017): https://pubmed.ncbi.nlm.nih.gov/29265856/ — varied retrieval examples motivate using new probes rather than repeatedly testing identical items.

Macnamara et al. (2014): https://pubmed.ncbi.nlm.nih.gov/24986855/ — practice contributes to performance but does not explain all differences. Use feedback on a diagnosed skill; do not promise general intelligence or expertise from time spent.

Research supports components of this approach. The combined curriculum, adaptive diagnosis, durations, mastery thresholds, and broad transfer remain design hypotheses requiring learner data, human content review, and a mixed-age pilot.
