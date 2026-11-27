# Review notes: Apologist Academy film (draft 2, polish pass, Nov 27)

**Files** (not committed; sent in chat): `renders/Apologist Academy film (draft 2, music A).mp4` and `… music B).mp4`. 1920×1080, 30 fps, H.264 (CRF 16, ~3 Mb/s) + AAC 192k, 2:49.9. A and B differ only in the music. A 4K picture (`--resolution landscape-4k`) is rendered for the YouTube upload once the music is chosen.

## Needs Jarret's ears
- **Music A or B.**
  - A is the original track, re-cut: it is silent until 0:22, and its build (measured at 18.02 s in the track, on the beat) lands on the title's arrival at 0:40.6.
  - B is the new ElevenLabs track composed to the cut list. Measured, B did not follow its sections: it builds through the cold open, has no dips, and only its fade-out at the end is timed. So the mix writes the arc onto both A and B as volume automation.
- **The new mix.** Measured, not heard:
  - Ducking now holds over whole takes. The music sits at the same level under the words and in the pauses between Jason's phrases (−16.0 vs −15.8 dB, relative to the voice).
  - Rises of more than 6 dB within 0.5 s fell from 189 to 37 (A) and 17 (B). What is left is the piano's own note attacks.
- **The voice chain:** high-pass at 80 Hz, 3:1 compression, +2 dB at 3 kHz. A peak limiter sits before the loudness pass, catching the TTS plosives. Whether it sounds natural is a listening call.
- **The sound effects:**
  - key and delete ticks on the drafts and on the bookend reply;
  - a riser and impact into the title;
  - a send sound;
  - three rotating whooshes;
  - pops on the rule chips.

## Measured
- **Loudness:** −14.0 LUFS integrated, −1.6 dBTP, LRA 3.5–3.6 LU. The second loudness pass ran linear (it no longer falls back to the dynamic mode).
- **QR code** on the end card, decoded from a rendered frame: https://apologistacademy.pages.dev/
- **`hyperframes check`:** no errors. The warnings kept on purpose:
  - *Drafts and code lines flagged as too short to read:* the cliché drafts are deliberately brief. The code lines are receipts; the claim beside each one carries the read.
  - *Real quotes a little under the reading floor (4.5–5.6 s against 5.1–6.5 s):* the narration says the same thing at the same time.
  - *Small text inside the drawn phones:* marked `data-layout-ignore`.
- **Phone-width sheet (360 px)** from `snapshot --review`: every headline, quote and claim reads.
- **Footage speeds:** 0.91× to 1.43×. Reply 2 is fast-forwarded at 4× and the personal answer streams at 1.3×; both are deliberate. This cuts the old 6.5 s lull to about 4 s.

## What changed from draft 1
1. **Cold open:** opens tight on the question (it reads at about 41 px), and the camera moves to the reply field so the drafts read in full, with key ticks.
2. **Title:** "Christians → ?" comes back and the "?" becomes the app's mark. The phone rises in under the title.
3. **Demo:**
   - the AI's real lines are enlarged beside the phone, each labeled: the opening, a pair showing that it answers what you said, Coach's hint and sample reply;
   - an "Ask Coach" pointer;
   - the run's actual settings marked "This run";
   - a centred personal beat;
   - zoomed text fades at the frame edge instead of being cut through;
   - fewer, gentler camera moves.
4. **Match cuts:** the demo phone carries into the three-screen shot, and the safeguards' code card becomes the server box.
5. **Safeguards:** shown beside the real rule lines from `server/prompts.ts`.
6. **How the AI is used:** a moving data-flow diagram, with real message text.
7. **End card:** beside the bookend phone, so the reply stays on screen. The URL and "Try it free. No account. Nothing to install." are large.
8. **Look:**
   - one continuous background for the whole film, with a light arc across the acts;
   - a still grain;
   - a rim light on the phones;
   - all reading text at 28 px or more;
   - five kinds of transition instead of one: blur swap, dip cut, morph/callback, continuous move, match cut.
9. **Captions:** none burned in. `renders/apologist-academy-film.srt` is for YouTube. The chapters in `../youtube-description.md` are re-timed, and each is at least 10 s.

## Weakest shots, if there's more time
- The "Who it's for" grid is still a set of cards.
- The personal beat's kicker sits over the dimmed phone.
- The Coach outline step only lights a pill; there was too little narration time to show the outline itself.

## What's real and what isn't
See `RESEARCH.md`. Every AI line on screen is real output from one live run (Nov 27, 04:32 UTC). The rule text is quoted from the code. The coworker text, the drafts and the bookend reply are illustrations.

## Rebuild
1. Re-time the narration: `python3 -I tools/timing.py`.
2. Build the scenes: `node tools/build.mjs`.
3. Render the picture: `npx hyperframes@0.8.223 render -o renders/draft2-video.mp4 --video-frame-format png --workers 3`. Add `--resolution landscape-4k` for the upload.
4. Mix and mux. For A:
   ```
   python3 -I tools/mix.py renders/draft2-video.mp4 "renders/<name>.mp4"
   ```
   For B, add `--music audio/music-v2.mp3 --scored` before the paths.
5. Write the captions file: `python3 -I tools/srt.py`.
