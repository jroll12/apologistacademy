"""YouTube captions (renders/apologist-academy-film.srt) from the same caption phrases the film burns in, plus the
lines that appear on screen instead (the verse, its follow-up line, the end card)."""
import json, os
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(FILM, "build", "timeline.json")))
script = {l["id"]: l["text"] for l in json.load(open(os.path.join(FILM, "script.json")))["lines"]}
rows = [(c["start"], c["end"], c["text"]) for c in tl["caps"]]
for lid in ("L5", "L6", "L22"):  # spoken over on-screen text, so not burned in; still captioned on YouTube
    ln = tl["lines"][lid]
    rows.append((ln["start"] - 0.08, ln["end"] + 0.3, script[lid]))
rows.sort()
ts = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)) % 1000:03d}"
out = os.path.join(FILM, "renders", "apologist-academy-film.srt")
with open(out, "w") as f:
    for i, (a, b, t) in enumerate(rows, 1):
        f.write(f"{i}\n{ts(max(0, a))} --> {ts(b)}\n{t}\n\n")
print(out, len(rows), "captions")
