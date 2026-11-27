"""A few sound effects from the ElevenLabs sound-effects API, for the film's visible actions.

    python3 docs/hackathon/film/tools/sfx_el.py [--dry-run]

Key from ELEVENLABS_API_KEY (never printed). Writes assets/sfx/el-<name>.mp3. If the API shape differs (check
https://elevenlabs.io/docs/api-reference/text-to-sound-effects), adjust the request, keep the prompts.
"""
import argparse, json, os, sys, urllib.error, urllib.request

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FX = [
    ("key-1", "a single soft smartphone touchscreen keyboard tap, short dry click, close and quiet", 0.5),
    ("key-2", "a single soft smartphone touchscreen keyboard tap, short dry click, close and quiet", 0.5),
    ("key-3", "a single soft smartphone touchscreen keyboard tap, short dry click, close and quiet", 0.5),
    ("delete", "a single soft smartphone keyboard delete key tap, slightly lower and duller click, quiet", 0.5),
    ("send", "a soft short upward swoosh of a chat message being sent from a phone, gentle and clean", 0.8),
    ("whoosh-1", "a soft airy transition whoosh, gentle, smooth, short, no bass boom", 1.0),
    ("whoosh-2", "a soft breathy swish passing by, gentle, short, no bass boom", 1.0),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    for name, text, sec in FX:
        print(f"{name:<9} {sec:.1f}s  {text}")
    if a.dry_run:
        return
    if not os.environ.get("ELEVENLABS_API_KEY"):
        sys.exit("ELEVENLABS_API_KEY is not set in this environment")
    os.makedirs(os.path.join(FILM, "assets", "sfx"), exist_ok=True)
    for name, text, sec in FX:
        body = {"text": text, "duration_seconds": sec, "prompt_influence": 0.6}
        req = urllib.request.Request(
            "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", data=json.dumps(body).encode(),
            method="POST", headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                data = r.read()
        except urllib.error.HTTPError as e:
            sys.exit(f"{name} failed: HTTP {e.code}: {e.read().decode(errors='replace')[:500]}")
        out = os.path.join(FILM, "assets", "sfx", f"el-{name}.mp3")
        open(out, "wb").write(data)
        print(f"wrote {out} ({len(data) // 1024} KB)")


if __name__ == "__main__":
    main()
