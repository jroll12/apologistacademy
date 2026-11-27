"""A music track composed to the film's cut list (ElevenLabs Music, composition plan).

    python3 docs/hackathon/film/tools/music_v2.py [--dry-run]

Reads the cut times from build/timeline.json, so each section of the music starts on a cut: near silence under the
cold open, piano under the question, the arrival on the title, a strip-back for the personal beat and the bookend, a
resolved ending on the end card. Key from ELEVENLABS_API_KEY (never printed). Writes audio/music-v2.mp3 and
audio/music-v2.plan.json (the plan that was sent). If the API shape differs from this (check
https://elevenlabs.io/docs/api-reference/music), adjust the request, keep the plan.
"""
import argparse, json, os, sys, urllib.error, urllib.request

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(FILM, "build", "timeline.json")))
cut, total = tl["cut"], tl["total"]
tk = {v["take"]: (v["start"], v["start"] + v["dur"]) for v in tl["vo"]}
card = tl["lines"]["L22"]["start"] - 0.35

GLOBAL = ["instrumental underscore for a narrated film", "felt piano", "warm soft string pads", "80 BPM", "D major",
          "hopeful", "understated", "leaves space for a spoken narrator", "warm and clear, with some air in the top end"]
NEGATIVE = ["vocals", "choir", "drum kit", "EDM", "cinematic hits", "trailer braams", "dark", "muffled", "lo-fi",
            "sudden loud changes"]
# (name, start, end, positive local styles)
PLAN = [
    ("Cold open", 0, cut["gap"], ["near silence", "one soft sustained low pad note", "very quiet", "tense",
                                  "unresolved", "no melody", "no rhythm"]),
    ("The question", cut["gap"], cut["title"], ["solo felt piano enters", "simple reflective motif", "quiet",
                                                 "slowly building", "hopeful but unresolved"]),
    ("Arrival", cut["title"], cut["demo"], ["the full warm texture arrives on the first beat of this section",
                                            "piano with string pads and a light pulse", "bright, resolved, hopeful"]),
    ("Walkthrough", cut["demo"], tk["personal"][0] - 1.0, ["steady warm light pulse", "piano and pads",
                                                            "understated", "stays out of the way of the narrator"]),
    ("Personal", tk["personal"][0] - 1.0, tk["review"][0], ["strip back to solo piano", "intimate", "tender",
                                                             "quiet"]),
    ("Review", tk["review"][0], cut["screens"], ["the warm light pulse returns", "piano and pads", "understated"]),
    ("Lift", cut["screens"], cut["safe"], ["a gentle lift", "fuller pads", "brighter"]),
    ("Trust", cut["safe"], cut["close"], ["steady", "calm confidence", "light pulse", "understated under narration"]),
    ("Bookend", cut["close"], card, ["strip back to solo piano", "tender", "quiet", "reflective"]),
    ("Resolve", card, total, ["warm full final chord", "gentle resolved cadence", "rings out and fades to silence at "
                              "the very end"]),
]


def build_plan():
    secs = []
    for name, a, b, pos in PLAN:
        ms = int(round((b - a) * 1000))
        if ms < 3000:
            sys.exit(f"section {name} is {ms} ms; the API needs at least 3000 ms; merge it with a neighbour")
        secs.append({"section_name": name, "positive_local_styles": pos, "negative_local_styles": [],
                     "duration_ms": ms, "lines": []})
    return {"positive_global_styles": GLOBAL, "negative_global_styles": NEGATIVE, "sections": secs}


def post(body):
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=json.dumps(body).encode(),
        method="POST", headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=900) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    plan = build_plan()
    out_plan = os.path.join(FILM, "audio", "music-v2.plan.json")
    os.makedirs(os.path.dirname(out_plan), exist_ok=True)
    json.dump(plan, open(out_plan, "w"), indent=1)
    for s in plan["sections"]:
        print(f'{s["section_name"]:<12} {s["duration_ms"] / 1000:6.2f} s')
    print(f"total {sum(s['duration_ms'] for s in plan['sections']) / 1000:.2f} s (film {total} s)")
    if a.dry_run:
        return
    if not os.environ.get("ELEVENLABS_API_KEY"):
        sys.exit("ELEVENLABS_API_KEY is not set in this environment")
    body = {"composition_plan": plan, "model_id": "music_v1", "respect_sections_durations": True}
    try:
        data = post(body)
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="replace")[:800]
        if e.code in (400, 422) and "respect_sections_durations" in msg:
            body.pop("respect_sections_durations")
            data = post(body)
        else:
            sys.exit(f"music failed: HTTP {e.code}: {msg}")
    out = os.path.join(FILM, "audio", "music-v2.mp3")
    open(out, "wb").write(data)
    print(f"wrote {out} ({len(data) // 1024} KB)")


if __name__ == "__main__":
    main()
