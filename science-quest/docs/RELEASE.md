# Release checks · 1.5.0

Added per-explorer reading preference migration/isolation tests, picture-cue coverage and unknown-variant guards, and a DOM settings/profile-switch test. Narration uses device voices at the saved speed. Actual voice playback and screen-reader/device behavior remain unverified.

---

# Release checks · 1.4.0

Content Studio: two pure workflow test groups and one DOM editor test cover validation, revision-bound approvals, rejection of malformed content, simulation previews, draft persistence and isolation from player saves. No real reviewer approvals were supplied or invented. The editor exports a packet for source integration; it cannot publish unreviewed runtime changes.

---

# Release checks · 1.3.0

42 automated test groups pass. Added shared-device co-op guards, distinct assisted/unassisted individual contributions, trial gates, role rotation, conflict-preserving shared-session imports, permanent per-profile world rewards, decoration placement, and an actual DOM walkthrough of the shared investigation. All 35 solo mission flows still pass. The offline cache includes all three new runtime modules.

Deleting a profile also removes shared sessions containing it so another explorer cannot reopen its answers there; other explorers retain their own individual journal contributions. Shared-device role names guide device handoff, not identity authentication. Group completion never awards individual mission mastery.

Real browser, device, educator and learner acceptance remains unverified. Private online rooms, account sync and complete course packs remain work in progress.

---

# Version 1.2 progress release

- Eight new domain-specific science models and guided investigations, with independent native diagrams.
- Accessible genotype, diffusion and circuit measurement records alongside their visual representations.
- Thirteen linked grade routes; each declares its current investigation scope and remaining course-development areas.
- Validated prerequisite links and a content-validation command, with adversarial tests for broken references, cycles, undefined terms and impossible targets.
- Full mission walkthrough expanded from 27 to 35 investigations. New numerical reference tests cover transmission, vibration, density states, heat capacity, Ohm’s law, genotype probability, diffusion conservation and shadow geometry.

Curriculum expansion is ongoing. Grade routes do not certify complete grade coverage. External science review, learner/device acceptance, complete course content and shared-player systems remain outstanding.

---

# Version 1.1 progress release

This is verified progress toward the full handoff, not a completion claim.

- Durable selected answers, feedback, hints and review checkpoints; validated transitions cannot skip checks.
- Learner-selected pairs of controlled trials, saved with assessment provenance.
- Executed trolley and sorting-ramp transfer designs in Rover Rescue and New Trolley; a later review requires a new transfer run.
- Correct selected-trial replay with reduced animation.
- Atomic fallback snapshots plus evidence; atomic import; serialized evidence deletion.
- Corrupt or unsupported saves open recovery without overwriting the original. Archiving preserves raw bytes and supports recovery export.
- Additive migration preserves version 1.0 evidence and world rewards.
- New controller, recovery, storage-failure, replay, checkpoint and transfer tests supplement the full 27-mission walkthrough.

The full requirement-by-requirement audit is in [COMPLETION_AUDIT.md](COMPLETION_AUDIT.md). Browser access was rechecked on September 29 and the app-server failed during initialization; visual/device acceptance remains unverified.

---

# Release checks · 1.0.0

## Automated verification

- Full DOM interaction flows through all 27 investigations: notice, predict, fair setup, controlled trials, comparison, explanation, and both transfer checks.
- All four arcade games completed through their three rounds.
- Rover oracle: heights 0.10 / 0.30 / 0.50 m produce 0.50 / 1.50 / 2.50 m. At 0.30 m, exit speed is approximately 2.424871 m/s. Landing comparison uses unrounded state.
- Every model parameter step produces finite deterministic outputs; every mission target has a solution.
- Night-lab baseline: 800 Wh stored, 640 Wh delivered, 160 Wh transferred to surroundings; 60 W × 10 h leaves 40 Wh, while 90 W × 10 h leaves a 260 Wh deficit.
- Plant growth decreases above the fictional 75% optimum. Replicate and daily displays are derived from the same deterministic model.
- A correct landing never awards mastery. All six independent categories must pass. Hinted answers stay uncredited until an independent retry.
- Separate profiles, invention rebuild, checkpoint reload, IndexedDB event/snapshot persistence, event import idempotence and per-profile event deletion are tested.
- Advanced energy missions require assembling the model operators before running experiments.

## Known verification limits

The browser automation policy check was unavailable for both GitHub and localhost. No browser screenshots, real browser end-to-end runs, touch hardware measurements, frame-rate measurements or child playtest results are claimed. Responsive CSS and native controls are implemented, but Android/iPad/laptop visual acceptance is pending. Read-aloud availability depends on the device.

## Science and content status

All mission packs: original early-access content, educator/science-review sign-off pending. There is no claim of complete NGSS coverage. The six independent categories are a product criterion, not proof of learning efficacy. Free-text explanations are stored for adult review and never automatically certified.

## Next production gates

1. Science educator review of all question/rubric combinations and adapter assumptions.
2. Device/keyboard/screen-reader walkthrough and offline/update verification in supported browsers.
3. Supervised learner trials with consent and no public rankings.
4. Expansion of each region into complete, reviewed course sequences before marketing broad K–12 coverage.
