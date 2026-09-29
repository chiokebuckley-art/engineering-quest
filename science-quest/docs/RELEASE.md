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
