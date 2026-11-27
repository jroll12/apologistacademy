"""Turn a capture.mjs run into one constant 30 fps H.264 clip per device, plus marks in clip seconds.

    python3 docs/hackathon/film/tools/clips.py <capture-dir>/<device> <out.mp4>

Each screencast frame is held until the next one arrives (the screen did not change in between), so the clip runs
in real time. Writes <out>.marks.json with each mark's time in the clip.
"""
import json, os, subprocess, sys

src, out = sys.argv[1], sys.argv[2]
frames = json.load(open(os.path.join(src, "frames.json")))
marks = json.load(open(os.path.join(src, "marks.json")))
t0 = frames[0]["t"]
end = max(marks[-1]["t"], frames[-1]["t"]) + 0.6
lst = os.path.join(src, "concat.txt")
with open(lst, "w") as f:
    for i, fr in enumerate(frames):
        nxt = frames[i + 1]["t"] if i + 1 < len(frames) else end
        f.write(f"file 'frames/{fr['f']}'\nduration {max(nxt - fr['t'], 0.001):.4f}\n")
    f.write(f"file 'frames/{frames[-1]['f']}'\n")
tmp = out + ".part.mp4"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-vf", "fps=30,format=yuv420p",
                "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-movflags", "+faststart", tmp], check=True, cwd=src if False else None)
os.replace(tmp, out)
rel = {m["label"]: round(m["t"] - t0, 3) for m in marks}
json.dump(rel, open(out.replace(".mp4", ".marks.json"), "w"), indent=1)
print(out, f"{end - t0:.1f}s", rel)
