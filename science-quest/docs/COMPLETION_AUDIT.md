# Full-scope completion audit

Objective: finish Science Quest described by the 24-page developer handoff and the user’s request to finish all of it. The existing 27-investigation release is a starting point, not a redefinition of that objective.

Audit date: 2026-09-29. Previous build changed authoritative state and deployed a playable first release (progress). This goal remains active. No requirement below is proved by this checklist alone.

| Handoff requirement | Evidence currently available | Remaining work / proof required |
| --- | --- | --- |
| 1–4: adventure, world restoration, six connected regions | Existing map, regional counters, missions | Replace counter-only restoration with persistent visible world upgrades and workshop decoration placement; review capstone outcomes |
| 3, 6, 14: Rover Rescue notice/predict/build/test/explain/apply | Reference equations and basic full-flow test | Independently chosen evidence pairs; two executed transfer designs; prediction rationale capture; no replay mismatch; checkpoint recovery at every step |
| 5, 18: home and navigation | Map, recommended mission, mode tabs | Verify unfinished mission recommendation on profile changes; all preparation links; measured phone and keyboard walkthrough |
| 7: Biodome Balance | Replicate model and daily record | Select both conditions, generated growth graph with equivalent table, environmental and genetic-factor investigations, valid uncertainty interpretation |
| 8: Night Lab | Ledger and operator construction | Variable loads, reserve, power constraints, uncertainty, model revision and transfer evidence in high-school sequence |
| 9–11: K–12 learning progression | 27 introductory investigations with broad band labels | Complete grade/pathway routes, prerequisites, vocabulary order, bridges, scientific/mathematical representations; all named disciplines in the handoff |
| 12: six independent checks, fresh equivalent retries, retained/review | Six boolean categories; partial review action | Durable scored attempts, item isolation, equivalent variants, provenance and criterion evidence; review without erasing world rewards |
| 13: Adventure, Free Lab, four arcade games | Implemented basic forms | Readiness-driven advanced tool gates; sound/visual equivalents; meaningful Build-Off efficiency comparison |
| 13, 19 E: 2–4 player co-op, later online ecosystem | Display-only local role rotation | Individual predictions/explanations, rotating ownership, shared simulation; private online rooms, no public chat; optional sync, idempotence and conflict recovery |
| 15: first 12 Motion Harbor missions, three context variants each | 12 titled missions; shared questions/adapters | Mission-specific reviewed variants, multi-stage restore-route capstone; separate evidence for design choices |
| 16: mission content format and publishing pipeline | Registry exists | Complete schema with versions, prerequisites, standards, rubrics, accessible forms, misconception feedback, units, variants; reject broken references and cycles; authoring/review/preview workflow |
| 17: modular model/controller/learning/save | Separate models and learning modules, monolithic UI/controller | Move durable mission transitions into controller; auditable event provenance; model-consistent rendering and tests |
| 17: persistence, migration, offline, update safety | IndexedDB and localStorage fallback; basic service worker | Recover corrupt/unsupported saves without overwriting; atomic fallback evidence; import transactions; migrate older content; interrupted animation checkpoint; offline/update browser checks |
| 18: profiles, readiness, accessibility, adult view | Settings, profiles, evidence journal | Separate reading settings, K–2 pictorial response path, adult review workflow, pause/replay control verification, screen-reader/zoom/touch QA |
| 19: all delivery gates | Early-access release deployed | Gates A–E are not complete; track actual implementation and validation separately |
| 20: accuracy, functional branches, persistence, access, performance | 17 test groups; reference model checks | Expand adversarial/branch tests; reference Android/iPad/laptop runs, 30 fps and input-latency measurement; external science/education review and observed child pilot |
| 21–22: standards crosswalk, source boundaries | Partial mappings in supplied handoff | Per-expectation lesson/practice/rubric/transfer/review ledger and linked primary sources; no false certification or efficacy claims |
| 23–24: reusable native controls separate from art | Generated background and native SVG lab diagrams | Visual browser/device review still unverified |
| User: live game like other GitHub games | GitHub Pages deployments successful | Keep source and hosted branches synchronized; verify each shipped update; do not mark full completion merely because a deployment is green |

## External acceptance that cannot be fabricated

The handoff requires named science/educator review and observed learner/device tests. Software and reviewer tooling can be prepared autonomously; actual reviewer sign-off, participant consent, child sessions and physical-device observations require real people/devices. Until those occur, they remain unverified. There is extensive independent implementation work available before reaching that dependency.

## Current verification access

The prior build could not use the browser because its administrator-policy check was unavailable. On this resumed goal turn, revalidation reports that the browser app-server exits before initialization. No alternate browser automation or raw browser-control bypass is being used. DOM/model/storage tests remain available and are not described as browser or device verification.

## Verified progress in version 1.1

`tests/controller.test.mjs`, `tests/fallback-storage.test.mjs`, `tests/recovery-app.test.mjs`, `tests/transfers.test.mjs`, the IndexedDB tests, and the expanded DOM walkthrough provide evidence for durable selected answers/feedback, explicit evidence-pair selection, state-transition guards, version-1.0 additive migration, atomic fallback/import operations, raw-save recovery, selected-trial replay, and two executed ramp transfers. This closes those implementation sub-items; it does not prove curriculum completion, all possible checkpoint/animation interruptions, reviewer acceptance, or real device behavior.

Next implementation focus: formal content contracts and complete grade/pathway course packs with authored variants; individual co-op evidence; visible world upgrades; advanced domain models and capstones. Preserve the full remaining scope in the table above.

## Verified progress in version 1.2

Added eight previously missing science domains as real model-backed missions, not duplicate titles. `src/curriculum.js` provides 13 navigable grade routes and explicitly enumerates still-missing course topics. `src/content-contract.js` and `scripts/validate-content.mjs` validate model references, parameters, vocabulary, question shapes, targets and prerequisite cycles; adversarial tests prove rejection of representative invalid content. `tests/foundation.test.mjs` checks reference values, diffusion conservation, genotype probabilities, buoyancy states and domain-specific rendering. Grade routes and these tests do not prove the remaining K–12 curriculum complete. Shared-player systems, authoring/review workflow, richer capstones, K–2 picture interaction, world restoration and external acceptance remain open.

## Verified progress in version 1.3

Shared-device co-op now supports 2–4 local explorers, each with separately owned prediction/explanation records and assistance flags. Experiments require all predictions, two different controlled trials, and each explanation; roles rotate on the next round. Group completion does not touch solo mastery. Profile-conflicting backups preserve/remap shared sessions and evidence, and deleting a participant removes their shared sessions. Native map overlays show 18 permanent facilities; six earned workshop decorations support persistent placement. Unit and DOM interaction tests cover these behaviors, bringing the suite to 42 groups. This closes the local co-op and basic visible restoration implementation items; online co-op, full curriculum and external acceptance remain open.

## Version 1.4 authoring workflow

The native Content Studio supports local draft save/import/export, editable mission JSON with rubrics and sources, actual-model previews, three review areas and release-packet export. Content changes invalidate previous review approvals; latest revision requests supersede prior approval. Test records are explicitly fictional, not science sign-off. This is a single-device authoring workflow; reviewer authentication, collaborative editing and actual educator review remain unverified.

## Version 1.5 reading adaptation

Per-explorer reading preferences migrate from existing global settings once and persist independently. Solo choices can be read individually without selecting an answer; mission narration includes choices and has a stop control. Four early-years prediction items have matched picture cues for all options, with exact-text matching to avoid applying a cue to a different retry question. Complete K–2 picture coverage, non-reader testing and real assistive-technology review remain outstanding.

## Version 1.6 evidence and adult discussion

Assessment histories now retain exact scored item/response snapshots, assistance, model/content provenance, selected and transfer trial IDs, and learner notes. Optional prediction reasoning is persisted. Adults can record discussion notes tied to the attempts and written reasoning reviewed; notes are local declarations and never alter mastery. Existing saves preserve earlier evidence without fabricated attempt history. Fresh equivalent item banks and external review remain outstanding.

## Version 1.7 advanced energy sequence

Three authored high-school investigations add variable-load energy accounting, reserve planning, delivery power constraints and bounded uncertainty. Interval ledgers conserve energy, report unserved demand and never show negative physical storage. Four model test groups check reference cases and invalid inputs; the DOM suite executes all 38 missions. The sequence includes numerical transfer questions and a linked prerequisite progression. Open-ended model construction, executed advanced transfer designs, authentic research projects and external review remain outstanding.

## Cloud service foundation (not live)

Added an isolated Cloudflare Durable Object service, private-key client protocol, transaction-protected revision updates, retry idempotence, conflict responses, evidence collision rejection and ten-snapshot recovery history. Four protocol/handler test groups and the deployment dry run pass. The available Cloudflare CLI explicitly reports no authentication; sign-in has been requested. No live backend, cross-device sync UI or private-room service is claimed. Independent curriculum/game work remains available, so the overall goal is not blocked.

## Version 1.8 sync client integration

Device-side sync now persists pending operation payloads before network writes, retries an identical operation after lost responses/reloads, prevents overlapping actions, and preserves local/remote conflict snapshots through explicit reconciliation. A dedicated sync page handles connection, transfer, recovery export, disconnection and cloud deletion. Credentials are held separately from gameplay backups. Protocol, storage-double and DOM tests pass locally. The service is still not deployed, and live cross-device concurrency, automatic background sync and private online rooms remain incomplete.

## Version 1.9 private-room implementation

A separate Durable Object room namespace now runs authoritative 2–4-player investigations using the shared simulation and assessment functions. Private invite and per-player keys, enforced turns/roles, hidden current-round answers, retry idempotence, host closure, 24-hour expiration, bounded rounds/trials and absence of chat/public discovery are implemented. The room client persists pending actions before sending and imports only the current player’s contributions into their local profile, idempotently and without mastery awards. Five protocol/client/DOM groups pass, plus a successful deployment dry run. Deployed auth/isolation, actual cross-device latency and dropout behavior remain unverified because Cloudflare sign-in is pending.

## Version 1.10 chemistry expansion

Five model-backed investigations add phase-change energy, physical separation/purity, atomic and mass numbers, discrete reaction stoichiometry and bond-energy accounting. Native scientific scenes and equivalent tables share results. Six new test groups cover mass/atom conservation, phase-change temperature behavior, recovery versus purity, isotope invariants, energy signs and rendering. Grade routes link these additions and retain missing topics explicitly. This is a chemistry sequence expansion, not proof of complete chemistry/course coverage or educator acceptance.

## Version 1.11 equivalent assessment contexts

Each of the twelve Motion Harbor missions now has an original context plus two specified comparison contexts, with valid model parameters and six corresponding retry/review items. The controller selects these on later attempts. Revealed-item identity persists independently of the current attempt’s hint flag; repeated bank cycling cannot award independent credit for that item. Prior assisted assessment snapshots are also recognized. Contexts are assessment variants, not full replayable mission redesigns, and science/educator review remains pending. Full capstone execution and broader item banks remain open.

## Version 1.12 executed harbor capstone

Restore the Route now gates new completion on a connected ramp/lane/cushion model. Learners predict, compare two controlled trials and explain each of three design decisions; a final saved trial must reach the 1 m delivery point, meet the 0.30 m ramp limit, retain 0.1–1 J arrival energy and stop with average cushion force at most 5 N. Physics tests check energy conservation and a 0.98 J / 4.9 N reference design; the full DOM mission walkthrough executes all six capstone trials. Existing completed saves retain prior earned progress and can revisit the new capstone. Peak forces, real cushion behavior and external review remain outside the verified scope.

## Version 1.13 biology expansion

Five new investigations model photosynthesis/respiration net atom accounting, coding DNA/mRNA/translation, bounded logistic growth and deterministic changes in heritable-type frequency. Conservation and reference tests cover every allowed supply input, multiple sequence effects and population bounds. The biology pathway links this sequence while retaining cell regulation, body systems, speciation and ecosystem-network gaps. Browser access was rechecked: native access reports a locked Mac and the browser app-server still fails initialization. Unlock was requested; no browser/device acceptance is claimed.

## Version 1.14 Earth and space expansion

Five new investigations cover rainfall measurement, plate-motion rates, radioactive half-lives, reflected/absorbed/emitted radiation and stellar luminosity scaling. Five reference test groups check length-unit conversions, parent/daughter conservation, radiative flux balance and fourth-power scaling. The full DOM flow covers 53 investigations. Actual climate datasets, landform/erosion sequences, water-cycle modeling, stratigraphy and full stellar evolution remain incomplete; these ideal models do not stand in for those requirements.

## Version 1.15 paired Biodome evidence

The Biodome notebook now graphs the two explicitly selected saved conditions across all recorded days, using solid/circle and dashed/square encodings plus an equivalent daily table. A replicate table includes all three plants, saved means and ranges; missing historical observations remain missing rather than being recomputed. Tests cover selecting older trials, reversed order, confounded pairs, saved historical values and explicit uncertainty limits. This closes the paired growth-graph/table implementation item. Genetic/environment interaction investigations, scientific uncertainty assessment and external learner review remain unfinished.

## Version 1.16 inherited and environmental growth factors

Two connected middle-school investigations now compare fictional inherited types at fixed light and compare both types across light settings. Full group records retain three replicates and means for every trial. Reference tests show equal starting conditions, fixed type identity, differing response curves and a reversal of height ranking across environments; the 55-mission DOM walkthrough exercises the new activities. Numerical parameters are expressly fictional. These close the basic genetic/environmental investigation implementation gap; empirical evidence work, broader uncertainty analysis, educator sign-off and observed learner/device acceptance remain unverified.

## Version 1.17 Build-Off design comparison

Build-Off now retains three successful same-distance designs and asks learners to identify the least starting-energy requirement and explain its relation to height and rolling resistance. The comparison table, selected design and explanation persist in the explorer journal; backup validation rejects altered model measurements. Wrong comparisons cannot complete the challenge, and arcade outcomes never alter mission mastery. The interface explicitly distinguishes task energy requirements from a physical conversion-efficiency percentage. Advanced-tool readiness gates, full arcade accessibility/device testing and external acceptance remain incomplete.

## Version 1.18 readiness-based advanced tools

Combined ramp/surface controls require demonstrated Rover Rescue and Stopping Zone evidence; storage/efficiency controls require demonstrated Night Lab evidence. The gate uses all six independent categories through the existing skill state, including failed-review handling, and ignores reading level and arcade scores. Standard sandbox tests and all guided missions remain available. Locked controls list missing preparation with direct mission links. Previously saved inventions remain viewable; a locked custom configuration cannot run silently or be overwritten, and the explorer can explicitly restore standard settings while keeping saved trials. Unit and DOM tests cover active-profile separation, supported completion, valid edits and rejection of invalid or unready options. Real device and learner acceptance remain pending.

## Version 1.19 executed advanced energy transfers

The reserve, delivery-power and uncertainty investigations now each require two executed transfer designs with revised schedules or constraints. Tests must use the new context options, serve every interval, preserve reserve and meet any power-setting limit before the explanation can be submitted. Equivalent base-scenario successes cannot satisfy the new brief. Every retry/review starts a fresh evidence window. Transfer questions carry stable context identities; interval records and actual settings are retained. Reference tests verify all six designs, conservation and rejection of stale/wrong-context evidence, and the full DOM walkthrough executes them. Open-ended model construction, integrated optimization and external acceptance remain outstanding.

## Version 1.20 quantitative physics expansion

Three model-backed investigations add constant-force mass comparisons, one-dimensional collision momentum/energy accounting and inverse-square point-charge fields. The physics pathway and preparation links include them; two new Motion Harbor activities have equivalent assessment contexts. Reference tests cover F = ma, trajectories, every restitution setting, momentum conservation, kinetic-energy transfer and field-unit conversion. Native scientific scenes have equivalent measurement tables. This expands the physics sequence; two-dimensional motion, rotation, magnetism, multiple-source fields, full thermal/wave coverage and external review remain outstanding.

## Version 1.21 optional starting-point activity

Profile settings now include a four-question, resumable and skippable starting-point activity. It suggests a relevant bridge or guided energy-planning mission, saves responses per explorer, supports question/choice narration and keeps reading preferences independent. It never awards evidence or unlocks tools. Validation covers malformed imports; unit and DOM tests exercise every suggestion branch, selected-response recovery, skipping, retrying, profile separation and opening the suggested mission. This is an unvalidated placement heuristic, not a diagnostic or educator-approved assessment. Browser availability was rechecked: the Mac remains locked and the browser connection cannot initialize, so visual/device acceptance is still unverified.

## Version 1.22 starter motion picture choices

First Move and Which Way now have shorter authored lessons and answers plus native diagrams for all six assessment stages, including equivalent retry contexts. Diagrams are available for correct and incorrect choices, never used as correctness badges, and unknown answers receive no guessed imagery. Separate Listen buttons and exact answer text remain available. Content version 2 distinguishes the rewritten items; existing saved evidence is preserved. Unit and full-flow DOM checks cover diagram presence and preserved item identities. This expands two starter paths; the other early-years missions, non-reader independence, voice playback and observed child/accessibility testing remain unfinished.

## Version 1.23 early nature picture choices and controls

The light, vibration, floating and shadow missions now join both starter motion missions with pictures for every authored and generated assessment step. Their questions and lessons use shorter language; the early floating transfer no longer requires a percentage calculation and the early shadow transfer uses a local observation comparison rather than an axial-tilt explanation. All six early-years slider readouts have qualitative labels, while exact scientific measurements remain in tables and model notes. Diagram branches distinguish relevant quantities, including submerged fraction rather than incorrectly treating every fully submerged object as floating. Unit and DOM checks cover all six paths. This implements broader picture support but does not prove independent non-reader usability, actual narration, screen-reader behavior or child acceptance.

## Version 1.24 source-linked coverage ledger

Added one public ledger row for each of the seven performance expectations explicitly targeted on handoff page 21. Each links lessons/practice, draft criteria, two current transfers, an official source, the assessment boundary and remaining work. Proposed/Supported labels are used; no row claims full assessment or expert review. Validation rejects broken mission references and unsupported status promotions. The audit identifies existing qualitative-boundary mismatches in elementary force/energy content, a missing middle-school planning task, independent high-school data analysis and learner-constructed energy models. These are actionable gaps, not hidden behind the mission count. The state/school alignment target remains undecided; the user has been asked asynchronously.

Direct mission links open/resume existing checkpoints. A service-worker unit test covers cached query-link and coverage-directory navigation without network access; this does not substitute for real-browser offline testing. The ledger and schema tests check every targeted mapping and its honest review status.

### v1.25 elementary boundary corrections

Replaced force arithmetic and mass/energy ratio transfers in three elementary missions. Qualitative retry prompts preserve item IDs, reveal history and model-backed outcomes; content versions advance to 2. Numeric models remain available. Coverage remains partial and unreviewed; complete context variants, curriculum development, deployment of cloud services and external acceptance remain outstanding.

### v1.26 middle-school investigation planning

Added a durable variable/measurement/control plan to Same Force, More Mass and qualitative prediction/transfer questions. Plan histories and assessment snapshots are available for adult discussion; read-aloud includes planning choices. The MS-PS2-2 ledger now identifies the remaining physical-equipment and educator review instead of an unimplemented planning task. This is still a structured planning exercise, not validated independent experimental design. All broader completion gaps remain open.

### v1.27 independent supplied motion records

Implemented a separate high-school analysis activity, linked from grade 11 and the HS-PS2-1 coverage row. Its authored records do not depend on the track simulator. Learners compute signed acceleration/force, extrapolate under an explicit constant-acceleration assumption, and critique unequal equal-time velocity increments. Data and estimate graph/table, quantitative rubric tolerances, saved histories, help exclusion, profile separation and import validation are present. These are synthetic teaching records: empirical causal investigation, expert review and physical-device acceptance remain required. Other curriculum and full-handoff gaps remain open.

### Cloud retry storage hardening after v1.27

Idempotency records now store SHA-256 fingerprints instead of up to 100 complete save payloads. Identical retries remain idempotent, changed data under the same operation ID is rejected, and older payload records are compacted during the next successful write without mutating the prior state. Targeted protocol/session/UI tests pass. Cloudflare authentication was rechecked and remains unavailable; browser inventory again reports a locked Mac and failed browser initialization. Cloud deployment, storage-limit validation and live cross-device acceptance remain open.

### Transactional cloud state chunks

Replaced the potentially oversized single save-state value with transaction-protected 64 KiB UTF-8 chunks and a checked manifest. Added legacy migration, removal of stale tail chunks, missing-chunk rejection and a pre-write total-size guard. Four new test groups cover large multilingual data, failure rollback, migration/corruption and the actual service handler. All 149 test groups pass. A separate Wrangler 4.143.0 local SQLite runtime check successfully retained four revisions / three recovery snapshots totaling 2,801,217 bytes, preserved Unicode, replayed requests and rejected changed retries. The disposable local save was removed and server stopped. Live cloud deployment remains blocked by authentication; real cross-device acceptance and the broader handoff are still incomplete.

### v1.28 learner-authored computational energy model

Implemented an arithmetic expression builder for a defined three-component rover–Earth–track system. Learners construct initial gravitational, final kinetic and thermal-remainder equations; the interpreter checks joule dimensions and evaluates multiple parameter combinations. Completion requires saved trials using the current equations in three scenarios, an explicitly negative-remainder diagnostic, and a structured interpretation. Written explanations remain ungraded adult-review material. Worked help excludes independent completion. The HS-PS3-1 row now links the actual model-construction activity and remains partial, Supported and unreviewed. This closes the basic equation-authoring implementation gap; integrated optimization, expert review, full curriculum, cloud deployment and device/learner acceptance remain incomplete.

### v1.29 water-cycle processes

Added Follow the Water to grade 6, bringing the registry to 59 missions and 46 models. The four-reservoir model conserves water across five explicit transfer processes, distinguishes gaseous vapor from liquid cloud droplets, and preserves step-by-step reservoir/flow records. Solar energy may enter although water does not. The teaching model omits ice, plant pathways and real spatial weather; the route retains these observations/extensions as unfinished rather than claiming a complete water-cycle curriculum. Review and device acceptance remain pending.

### v1.30 misconception coaching

Added specific explanations for every authored wrong choice in the first twelve starter missions, with shorter early-years language and dedicated fair-test/comparison coaching. Generated context items can still use a general fallback, marked as such in the saved record. Because coaching supplies the correct answer, it records permanent item revelation and assisted provenance before scoring; a later correct answer to that item cannot become independent evidence. Exact coaching is retained in attempt history and event payloads. This closes authored starter-distractor feedback coverage, not all mission/context feedback or external review.

### v1.31 retry-context feedback

Both additional item contexts for all twelve starter missions now receive targeted feedback across all six scored stages. The feedback is derived from the context’s model inputs/results or its authored misconception, and early-years responses preserve qualitative language. Tests exhaust every wrong-choice slot in these contexts and check signed force, inverse stopping relationships and assistance provenance. This removes the current starter retry bank’s generic fallback gap. It does not supply the still-required full replayable context variants or expert sign-off.

### v1.32 full Rover Rescue variants

Rover Rescue now has two full companion contexts: Library Return Route and Greenhouse Seed Delivery. They have independent mission/run identities, book/seedling cargo scenes, different default lane resistance, bay/height design briefs, all six evidence checks and four additional executed transfers. Each transfer requires fresh data with exact lane provenance. Content validation checks that target and height constraints can be met together. Grade 4 and completion-screen links make these discoverable.

Registry: 61 missions and 48 adapter registrations, including two configurations of the existing ramp model. This advances the three-context requirement for one of the first twelve missions. Review is still pending for all three; the other eleven starter missions still need full replayable variants. Automated model/DOM checks do not replace browser, touch-device or child acceptance. Cloud deployment and broader K–12 coverage remain unfinished.

### v1.33 sync-page coordination

Session mutations and whole import/merge/upload UI actions now use one origin-wide Web Lock, with immediate refusal when another sync page holds it. Exact pending payloads survive failures and are retried unchanged. A response checks storage has not changed before writing, protecting against older uncoordinated pages. Unsupported environments reject mutations while leaving key/recovery reads available.

Automated tests use two session instances and a lock-manager double, including delayed requests, failed responses, leaked scoped access, unsupported environments and stale responses. This implements coordination among participating sync pages; gameplay writers do not yet take this lock. Actual browser/device behavior, background sync, deployment and cross-device validation remain pending.

### v1.34 integrated energy optimization capstone

Power an Island Outpost now combines bounded energy demand/efficiency, peak power, reserve, equipment mass and fictional cost across two briefs. Four learner-controlled design variables form 80 permitted plans. Completion requires three executed comparisons per brief (two successful, one failed), a full computational search, a minimum-cost feasible choice and explanations of evidence and model limits. The longer-night transfer invalidates the original optimum; it requires a revised converter under the tighter mass constraint. Saved notebook evidence, graph/equivalent table, adult notes and help provenance support review. The earlier equation-construction activity is linked as preparation, not replaced by this supplied optimizer.

This implements the basic integrated energy-design capstone. It proves optimality only within the finite fictional design space and specified monotonic uncertainty bounds. Real equipment data, observed validation of scheduling/bounds, science/educator acceptance and physical-device testing remain outstanding. The game still has 61 guided missions plus three supplemental high-school activities; this does not complete all K–12 topics or the full handoff gates.

### v1.35 observed climate evidence

Read Earth’s Temperature Record uses a reproducible NASA GISTEMP v4 snapshot rather than fictional climate data. The activity includes all complete annual J-D records from 1880–2025, a full plot/equivalent table, source/publication links and the archived CSV. Four scored steps cover anomaly interpretation, two-decade arithmetic comparison, a contrasting short interval and explicit uncertainty/model-limit critique. Learner attempts retain dataset ID/checksum and help provenance; source checks and complete DOM flows pass. The source product is an analyzed observational estimate, not unprocessed instrument data.

This implements an initial observed climate-record investigation and connects it to the ideal energy-balance model. It does not supply climate attribution, regional climate investigations, statistical uncertainty propagation, observational validation of a predictive climate model, science/educator acceptance or physical-device tests. Registry remains 61 guided missions, now with four supplemental high-school activities. Broader K–12 topics and full handoff gates remain incomplete.

### v1.36 ecosystem budgets

Three guided food-web investigations add elementary food-matter pathways, a middle-school decomposer route and a high-school energy-allocation account. Two configurations of a six-pool carbon model preserve carbon across simultaneous transfers; a separate one-pass energy model conserves joules across retained biomass energy, detritus and thermal transfer. Carbon amounts, organism counts and energy quantities are explicitly separated. The carbon graph depicts selected routes and the saved tables show all transfers; energy tables distinguish intermediate amounts from final destinations. No result is exposed in the untested preview.

This expands the named food-matter/ecosystem topics, bringing the registry to 64 missions and 51 adapter configurations plus four supplemental activities. It does not establish complete ecosystem-course coverage: observed networks, environmental variability, nutrient/energy coupling, empirical rate validation, broader species interactions, educator acceptance and real-device testing remain open. The transfer fractions are original fictional teaching inputs, not measurements or a universal ecological efficiency law.

Browser access was rechecked during v1.36 verification: the tool still reports a locked Mac and browser app-server initialization failure. No actual browser/device acceptance is claimed. Ecosystem lessons now include their own vocabulary and preparation links, and carbon records distinguish display rounding from calculation precision.

### v1.37 chemistry course extension

Five guided investigations implement initial electron-shell patterns, mole ratios/limiting reactants/recovery, first-order rates, catalytic approach to dynamic equilibrium, and ideal strong acid–base neutralization. All expose assumptions and saved accounting tables; the kinetics graphs have equivalent time records. The registry is now 69 missions, 56 adapter configurations and four supplemental activities. Preparation and vocabulary connect the new chemistry sequence.

This fills introductory portions of the named chemistry topics. It does not close orbital bonding, observed yields and experimentally inferred rate laws, equilibrium disturbances, weak acids/buffers, authentic laboratory data, educator sign-off or actual-device acceptance. The first-12 full-context requirement, broader K–12 topic gaps, learner pilots and cloud deployment also remain open. No new browser/device verification is claimed in this release.

### v1.38 full stopping-lane contexts

Stopping Zone now has two full companion missions: Museum Return Lane and Harbor Parcel Lane. These are separate replayable guided investigations, not just renamed retry questions: they use distinct speeds and bays, independently saved evidence, native carrier visuals and four executed transfer designs. Changing the entry speed requires new recorded trials. Native motion records and mathematical tests establish modeled endpoint, monotonicity and conservation behavior; content checks establish permitted, solvable transfer settings. Transfer setup previews no longer manufacture a result to display the changed configuration.

This advances the first-12 context requirement for a second mission family, after Rover Rescue. The other ten original families still need their complete companion contexts, and all require actual educator/learner review. The registry is 71 guided missions, 58 adapter configurations and four supplemental activities. New adapter entries reuse the constant-resistance physical law; they are not new laws. Real-device testing, remaining curriculum scope, pilots and cloud deployment remain open. Automated DOM coverage is not browser/device acceptance.

### v1.39 IndexedDB session conflicts

Ordinary gameplay and auxiliary pages now use a revision-and-snapshot guard in each IndexedDB write transaction. Two cooperating sessions reading one revision cannot both replace it. All main-storage mutation paths participate, including event-only writes, snapshot/event imports and unreadable-save archival. Profile deletion is now one snapshot/evidence transaction. Stale-session errors preserve the durable winner and the losing tab’s in-memory progress; backup export includes its rejected events. The UI gives persistent recovery instructions and avoids update-triggered reloads after save failures.

Verification uses independently imported storage modules sharing fake IndexedDB and a DOM game harness. This is meaningful concurrency/state-machine coverage, not a real multi-tab browser test. localStorage fallback cross-tab coordination, actual browser/device acceptance, live cloud synchronization, background synchronization and the broader handoff requirements remain incomplete. Registry remains 71 guided missions, 58 model configurations and four supplemental activities.

The design relies on the [IndexedDB transaction scheduling contract](https://www.w3.org/TR/IndexedDB-3/#transaction-scheduling): transactions with overlapping write scopes are serialized. Comparison, revision update and content changes therefore share a transaction. This specification supports the design; it does not replace runtime acceptance on the target devices.

Browser availability changed during v1.39: browser-provider initialization still fails, but native Chrome controls became available. A real two-tab workflow at the isolated test origin 127.0.0.1:5199 verified conflict rejection, backup download, the newer explorer surviving reload, and recovery import preserving three profiles. Downloaded original/merged backups passed application validation and exact recovered-run comparison. See QA_1_39.md. This closes that specific desktop workflow check only; it does not establish Android/iPad, latency, offline update or full mission-flow acceptance.
