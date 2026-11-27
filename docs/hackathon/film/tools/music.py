"""One instrumental bed for the film from the ElevenLabs Music API.

    python3 docs/hackathon/film/tools/music.py [--seconds 225]

Key from ELEVENLABS_API_KEY (never printed). Writes docs/hackathon/film/audio/music.mp3. If the API shape differs
from this (check https://elevenlabs.io/docs/api-reference/music), adjust the request, keep the prompt.
"""
import argparse, json, os, sys, urllib.error, urllib.request

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMPT = (
    "Instrumental underscore for a warm, hopeful three and a half minute film about practicing hard conversations "
    "about faith. Felt piano with soft warm string pads and a gentle, light pulse, around 80 BPM, D major. "
    "Opening minute: sparse, reflective, quiet piano with a slightly unresolved feel. "
    "Middle: warmer and steadier, hopeful and understated, staying out of the way of a spoken narrator. "
    "Final forty seconds: fuller pads and a gentle lift, then a calm, resolved ending on a held chord. "
    "No vocals, no drum kit, no risers, no cinematic hits, no sudden changes."
)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seconds", type=int, default=225)
    a = ap.parse_args()
    if not os.environ.get("ELEVENLABS_API_KEY"):
        sys.exit("ELEVENLABS_API_KEY is not set in this environment")
    body = {"prompt": PROMPT, "music_length_ms": a.seconds * 1000, "model_id": "music_v1", "force_instrumental": True}
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=json.dumps(body).encode(),
        method="POST", headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            data = r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"music failed: HTTP {e.code}: {e.read().decode(errors='replace')[:500]}")
    os.makedirs(os.path.join(FILM, "audio"), exist_ok=True)
    out = os.path.join(FILM, "audio", "music.mp3")
    open(out, "wb").write(data)
    print(f"wrote {out} ({len(data) // 1024} KB)")


if __name__ == "__main__":
    main()
