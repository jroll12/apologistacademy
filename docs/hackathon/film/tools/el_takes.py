"""Generate the film's narration with ElevenLabs (voice Jason), one continuous take per entry in script.json "takes".

    python3 docs/hackathon/film/tools/el_takes.py [--only open,close] [--dry-run]

The key is read from ELEVENLABS_API_KEY and is never printed or written anywhere. Writes
docs/hackathon/film/audio/takes/<take>.mp3 and audio/takes/report.json. Existing takes are kept unless --only
names them (each roll spends credits). Same request shape as jroll12/promo-videos zogreo-intro-16x9/tools/el.py.
"""
import argparse, json, os, subprocess, sys, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(HERE)
OUT = os.path.join(FILM, "audio", "takes")


def spoken(text, table):
    for k in sorted(table, key=len, reverse=True):
        text = text.replace(k, table[k])
    return text


def tts(text, out_mp3, voice, model, settings):
    body = {"text": text, "model_id": model, "voice_settings": settings}
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), method="POST",
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = r.read()
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode(errors='replace')[:400]}"
    except urllib.error.URLError as e:
        return False, f"network: {e.reason}"
    if len(data) < 2000:
        return False, f"suspiciously small response ({len(data)} bytes)"
    open(out_mp3, "wb").write(data)
    return True, ""


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout.strip()
    return float(out or 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--variant", help="write <take>-<variant>.mp3 instead (never overwrites); use with --only")
    a = ap.parse_args()
    s = json.load(open(os.path.join(FILM, "script.json"), encoding="utf-8"))
    v = s["voice"]
    lines = {l["id"]: spoken(l["text"], s["spoken_elevenlabs"]) for l in s["lines"]}
    texts = {t["id"]: t["direction"] + " " + " ".join(lines[i] for i in t["lines"]) for t in s["takes"]}
    if a.dry_run:
        for k, t in texts.items():
            print(f"[{k}] {len(t)} chars: {t}")
        print("total characters:", sum(len(t) for t in texts.values()))
        return
    if not os.environ.get("ELEVENLABS_API_KEY"):
        sys.exit("ELEVENLABS_API_KEY is not set in this environment")
    os.makedirs(OUT, exist_ok=True)
    only = set(a.only.split(",")) if a.only else None
    spent = 0
    for t in s["takes"]:
        if a.variant:
            if only is None or t["id"] not in only:
                continue
            path = os.path.join(OUT, f"{t['id']}-{a.variant}.mp3")
            if os.path.exists(path):
                continue
        else:
            path = os.path.join(OUT, t["id"] + ".mp3")
            if os.path.exists(path) and (only is None or t["id"] not in only):
                continue
        ok, err = tts(texts[t["id"]], path, v["voice_id"], v["model_id"], v["settings"])
        if not ok:
            sys.exit(f"take {t['id']} failed: {err}")
        spent += len(texts[t["id"]])
        print(f"generated {os.path.basename(path)}: {len(texts[t['id']])} chars, {duration(path):.2f}s", flush=True)
    if a.variant:
        print(f"spent {spent} characters this run (variants; report.json unchanged)")
        return
    rep = {t["id"]: {"seconds": round(duration(os.path.join(OUT, t["id"] + ".mp3")), 2),
                     "words": len(" ".join(lines[i] for i in t["lines"]).split()),
                     "text": texts[t["id"]]} for t in s["takes"]}
    for r in rep.values():
        r["words_per_second"] = round(r["words"] / r["seconds"], 2) if r["seconds"] else None
    json.dump(rep, open(os.path.join(OUT, "report.json"), "w"), indent=1)
    print(f"spent {spent} characters this run; total {sum(r['seconds'] for r in rep.values()):.1f}s of voice")


if __name__ == "__main__":
    main()
