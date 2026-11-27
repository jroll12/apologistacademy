# Review notes: Apologist Academy film (draft 1, Nov 27)

**File:** `renders/Apologist Academy film (draft).mp4` (not committed; sent in chat). 1920×1080, 30 fps, H.264 (CRF 16) + AAC 192k, 2:52.2.

## Needs Jarret's ears or eyes
- **The voice.** I can't hear audio. I measured it: pace 2.6 to 3.1 words a second, the two re-taken lines now have pitch movement like the takes he liked (111 to 138 Hz spread vs 93 to 106 before), and the clicks before "So we built" and "Stuck?" are cut. Whether it *sounds* right is his call.
- **The four re-takes:** 1B (opening), 2B (freeze), 3A (debate), 4A (carefully). A/B files were sent; swap any by name.
- **The opening line** now says "If God is good, why does my sister have cancer?" (the old take read as "why didn't"). Slide 2 of the deck still has the old wording; that's fine for slides, but say if he wants them to match.
- **The music** (ElevenLabs Music): measured, not heard. It sits about 18 dB under the voice and comes up in the gaps.

## Measured
- Loudness −14.0 LUFS integrated, −1.0 dBTP, LRA 2.8 LU (YouTube's target).
- No silence in the mix except the first frame and the last second after the music resolves.
- Audio and picture are the same length (172.2 s).
- QR on the end card, decoded from a rendered frame: https://apologistacademy.pages.dev/
- `hyperframes check`: no errors; warnings are small text inside the drawn phone (status bar, contact name) and a callback note on the typing effect.
- Demo footage speeds: 0.86× to 1.43× (reply 2 is fast-forwarded at 2.4× on purpose).

## Looked at (frames, not motion)
- 36 frames across the render plus every camera move in the demo. Captions match the spoken words (built from the word timings). No text clipped in the callouts.

## What's real and what isn't
See `RESEARCH.md`. In short: every AI line on screen is real output from the live site (one run, Nov 27 04:32 UTC); the coworker text and the drafts are illustrations; product claims are checked against the code.

## Rebuild
`python3 -I tools/timing.py` → `node tools/build.mjs` → `npx hyperframes@0.8.223 render -o renders/draft-video.mp4 --video-frame-format png` → `python3 -I tools/mix.py renders/draft-video.mp4 "renders/<name>.mp4"` → `python3 -I tools/srt.py`. Footage: `tools/mockapi.mjs` + `tools/capture.mjs` + `tools/clips.py` (clips are not committed; re-film them).
