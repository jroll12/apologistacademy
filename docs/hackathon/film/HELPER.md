# Brief for the helper session (Default environment)

This environment can reach ElevenLabs and, we hope, the live site. The main session (environment "Apologist Academy")
cannot, so it builds the film and you make three things for it. Work on branch `claude/academy-film-vo`.
Never push to `main`. Never print, log or commit the ElevenLabs key.

## 0. Check access first (no credits spent)
```bash
test -n "$ELEVENLABS_API_KEY" && echo key-present || echo NO-KEY
curl -s -o /dev/null -w 'elevenlabs %{http_code}\n' https://api.elevenlabs.io/v1/models -H "xi-api-key: $ELEVENLABS_API_KEY"
curl -s https://apologistacademy.pages.dev/api/status; echo
```
If there is no key or ElevenLabs is blocked, stop and report exactly that. Do not substitute another voice or service.

## 1. Narration: Jason, one take per scene (about 2,700 characters)
```bash
python3 docs/hackathon/film/tools/el_takes.py --dry-run          # read the texts once
python3 docs/hackathon/film/tools/el_takes.py --only open         # one take first; if it fails, stop and report
python3 docs/hackathon/film/tools/el_takes.py                     # the rest
```
Out: `docs/hackathon/film/audio/takes/*.mp3` and `report.json`. If a take is over 2.9 words per second, re-roll just
that take once with `--only <id>`. Do not edit `script.json` wording.

## 2. Music bed (ElevenLabs Music)
```bash
python3 docs/hackathon/film/tools/music.py --seconds 225
```
Out: `docs/hackathon/film/audio/music.mp3`. If the endpoint or fields differ, read the ElevenLabs Music API docs,
fix the request in `music.py` (keep the prompt and instrumental-only), and retry once. If the plan has no access to
Music, skip it and say so.

## 3. Real AI replies from the live site
Only if `/api/status` above returned `{"live":true}`:
```bash
node docs/hackathon/film/tools/live_capture.mjs https://apologistacademy.pages.dev
```
Out: `docs/hackathon/film/capture/live-capture.json` and `live-review.png`. Run it once. It uses about 8 live calls.
If it fails partway, report the error and whatever it printed; do not loop.

## 4. Hand back
Commit only `docs/hackathon/film/audio/**`, `docs/hackathon/film/capture/**` and any fix to `tools/`, push
`claude/academy-film-vo`, then reply with: which steps worked, each take's seconds and words per second (from
`report.json`), music length, the skeptic's six lines from the capture, and anything that failed with its error.
