"""Word times for every narration take, mapped back to the script's lines.

    python3 -I docs/hackathon/film/tools/timing.py

For each take in script.json: trims the lead-in and tail (keeps 0.12 s), writes assets/vo/<take>.wav, runs
faster-whisper (small.en, word timestamps) on it, and aligns the recognized words to the script's spoken text.
Writes build/takes.json: per take its length, words, and each line's start and end in take seconds.
"""
import difflib, json, os, re, subprocess
import numpy as np
import soundfile as sf

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def trim(a, head=0.05, tail=0.15, fade=0.012):
    """Cut to the speech, keeping 50 ms before and 150 ms after, with 12 ms fades. Two takes (intro, coach) open
    with a short click or lip noise before the first word, heard as a glitch: if the first sound is shorter than
    80 ms, at least 20 dB under the take's peak, and followed by a quiet frame, it is dropped."""
    hop = int(SR * 0.01)
    n = len(a) // hop
    db = 20 * np.log10(np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-12)
    top = db.max()
    on = np.where(db > top - 52)[0]
    first, last = on[0], on[-1]
    floor = 0  # never start inside a dropped noise
    for _ in range(3):  # the noise can come in two or three short pieces
        j = first
        while j < n and db[j] > top - 52:
            j += 1
        nxt = np.where(db[j:] > top - 52)[0] if j < n else []
        if not (j - first < 8 and db[first:j].max() < top - 20 and len(nxt)):
            break
        print(f"  dropped {(j - first) * 10} ms of noise before the first word", flush=True)
        floor = j * hop
        first = j + nxt[0]
    s0 = max(floor, first * hop - int(head * SR))
    s1 = min(len(a), (last + 1) * hop + int(tail * SR))
    out = a[s0:s1].copy()
    f = int(fade * SR)
    out[:f] *= np.linspace(0, 1, f, dtype=np.float32)
    out[-f:] *= np.linspace(1, 0, f, dtype=np.float32)
    return out


NUM = {"1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
       "10": "ten", "16": "sixteen", "500": "fivehundred"}


def norm(w):
    w = re.sub(r"[^a-z0-9]", "", w.lower())
    return NUM.get(w, w)


def main():
    from faster_whisper import WhisperModel
    s = json.load(open(os.path.join(FILM, "script.json"), encoding="utf-8"))
    sp = s["spoken_elevenlabs"]

    def spoken(t):
        for k in sorted(sp, key=len, reverse=True):
            t = t.replace(k, sp[k])
        return t

    lines = {l["id"]: l for l in s["lines"]}
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    os.makedirs(os.path.join(FILM, "assets", "vo"), exist_ok=True)
    out = {}
    for t in s["takes"]:
        a = trim(decode(os.path.join(FILM, "audio", "takes", t.get("file", t["id"]) + ".mp3")))
        wav = os.path.join(FILM, "assets", "vo", t["id"] + ".wav")
        sf.write(wav, a, SR, subtype="PCM_16")
        a16 = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                                           capture_output=True, check=True).stdout, np.float32).copy()
        segs, _ = model.transcribe(a16, word_timestamps=True, language="en", beam_size=5,
                                   initial_prompt="Apologist Academy. Coach. Peter. Jesus.")
        heard = [{"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)} for sg in segs for w in sg.words]
        # script tokens, each tagged with its line
        toks = []
        for lid in t["lines"]:
            for w in spoken(lines[lid]["text"]).split():
                toks.append((lid, w))
        sm = difflib.SequenceMatcher(a=[norm(w) for _, w in toks], b=[norm(h["w"]) for h in heard], autojunk=False)
        match = {}
        for blk in sm.get_matching_blocks():
            for k in range(blk.size):
                match[blk.a + k] = blk.b + k
        per = {}
        for i, (lid, w) in enumerate(toks):
            if i in match:
                h = heard[match[i]]
                per.setdefault(lid, []).append({"w": w, "start": h["start"], "end": h["end"]})
        line_t = {lid: {"start": per[lid][0]["start"], "end": per[lid][-1]["end"], "words": per[lid]} for lid in t["lines"] if lid in per}
        matched = len(match) / max(1, len(toks))
        out[t["id"]] = {"dur": round(len(a) / SR, 3), "lines": line_t, "heard": " ".join(h["w"] for h in heard), "match": round(matched, 3)}
        print(f"{t['id']}: {len(a) / SR:.2f}s, {matched:.0%} of script words matched; heard: {out[t['id']]['heard'][:90]}", flush=True)
    os.makedirs(os.path.join(FILM, "build"), exist_ok=True)
    json.dump(out, open(os.path.join(FILM, "build", "takes.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
