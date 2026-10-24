# Daily actions and how-to guides

Adapted from Engineering Quest's current GitHub HomeScreen.tsx and src/content/howto.ts in command-center/engineering-quest. The shared pattern is one next-task card, GO/resume, ordered done/current/later rows, contextual live tours, and a replayable Watch shelf.

Relationship Lab now opens to its daily actions. GO launches/resumes the current action; finishing an action returns to the daily card before the next action. Completion and plan position remain inside the existing synced lab save. Dates use America/Chicago; finishing an earlier day's investigation does not advance a new day's plan.

Three original captioned motion-graphic videos are included: daily plan (32 s), investigation (40 s), and device sync (24 s). These are explanatory clips, not recordings of a user's play. Native video controls support pausing, seeking, replay and mobile inline playback. English WebVTT, transcripts, and optional browser-voice caption reading accompany the clips. Live tours highlight actual controls and never submit answers. Watching a guide does not earn learning credit.

53 automated tests passed, including playable MP4 metadata, caption timing/count, calendar rollover, saved plan position, prior investigation tests, lab assessments, and sync. Browser preview verified the video loads with duration 32 s, readyState 4, no media error and one caption track; the live tour advanced to the GO explanation.

Video generation is reproducible with `node build-guides.mjs` (requires ffmpeg and the DejaVu Sans font). Text intermediates are ignored by Git. Native-device Safari and assistive-technology evaluation remain outside these Chromium checks.
