"""The film's sound, mixed from build/timeline.json: Jason's takes where the build placed them, the music bed under
them, and the light sound effects. Loudness is set for YouTube (-14 LUFS integrated, -1 dBTP), in two passes.

    python3 -I docs/hackathon/film/tools/mix.py [--timeline PATH] [--music PATH] [--scored] [video.mp4 out.mp4]

Writes renders/mix.wav and stems (renders/stems/voice.wav, music.wav, sfx.wav). With a video and an output path,
also muxes the mix onto the picture without re-encoding it.

Voice: the takes are summed into one narration bus, then high-passed at 80 Hz, compressed gently (3:1 on peaks,
10 ms attack, 150 ms release) and given about +2 dB of presence at 3 kHz.

Music, default mode (re-cut): the bed (audio/music.mp3) opens with about 18 s of quiet piano and then builds. The
mixer finds that build (energy rise in 0.25 s windows, refined to the strongest onset, snapped to the bed's beat
grid) and places the bed so the build lands exactly on cut.title. The bed enters with a 2 s fade-in; before it
there is only voice and sound effects. Near the end it crossfades (3 s, on a beat) into the bed's last ~30 s so its
own resolved ending lands on the end of the film.
Music, --scored: a track composed to the film's cuts (audio/music-v2.mp3) plays from 0:00 as it is, trimmed to the
film with a 1.5 s fade if it runs long, padded with silence if it is short.

Either way the bed gets a static -3 dB cut around 350 Hz (where Jason's voice has its body) and is ducked by an
envelope computed from the narration windows, not by a compressor: it stays down (-9 dB) for the whole of each take,
pauses included, and comes back up only between takes more than 1.2 s apart (0.4 s ramps; the ramp down starts
0.3 s before the take). Its overall level is set from the measured voice so that, in 0.25 s windows, it sits about
16.5 dB under the voice's median speech level while Jason speaks, and about 7.5 dB under it in the open gaps.

Sound effects: each timeline entry {f, at, vol} plays assets/sfx/<f>.mp3 from `at`. With "align": "peak" the clip is
placed so its loudest sample lands one frame (1/30 s) after `at` instead.
"""
import argparse, json, os, subprocess, sys, tempfile

import numpy as np

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda *p: os.path.join(FILM, *p)
SR = 48000
FPS = 30.0

# music: re-cut (default) mode
MUSIC_TAIL = 30.0     # seconds of the bed's ending to land on the end of the film
XF = 3.0              # crossfade into the ending
TAIL_SLACK = 0.6      # the bed's last sample lands this long after the film's end (as before)
FADE_IN = 2.0         # fade-in where the bed first becomes audible
# music: scored mode
SCORED_FADE = 1.5     # fade at the end if the scored track runs long
# music: ducking envelope
DUCK_DB = 9.0         # depth while Jason speaks
RAMP = 0.4            # ramp length, down and up
PRE = 0.3             # the ramp down starts this long before a take
GAP_MIN = 1.2         # the bed comes back up only in gaps between takes longer than this
UNDER_VOICE_DB = -16.5  # median bed level under speech, relative to the voice's median speech level
GAP_VOICE_DB = -7.5   # median bed level in the open gaps, relative to the same
WIN = 0.25            # analysis window (s)
SPEECH_DB = -45.0     # a window is speech when the voice is above this (dBFS RMS)
# EQ and dynamics
CARVE = "equalizer=f=350:t=o:w=1:g=-3"
VOICE_CHAIN = ("highpass=f=80:poles=2,"
               "acompressor=threshold=-14dB:ratio=3:attack=10:release=150:knee=2.5:makeup=1,"
               "equalizer=f=3000:t=q:w=1:g=2")
RAW = ["-f", "f32le", "-ar", str(SR), "-ac", "1"]


def run(args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-2000:])
    return r.stderr


def decode(path):
    """Mono 48 kHz float samples of any audio file."""
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, *RAW, "-"], capture_output=True)
    if r.returncode:
        sys.exit(r.stderr.decode()[-2000:])
    return np.frombuffer(r.stdout, np.float32).astype(np.float64)


def win_db(x, w=WIN):
    n = int(round(w * SR))
    m = len(x) // n
    return 10 * np.log10(np.mean(x[:m * n].reshape(m, n) ** 2, axis=1) + 1e-12)


def ebur128(path, raw=False):
    err = run(["ffmpeg", "-nostats", "-v", "info", *(RAW if raw else []), "-i", path,
               "-af", "ebur128=framelog=verbose:peak=true", "-f", "null", "-"])
    out = {}
    for line in err.splitlines():
        p = line.split()
        if len(p) >= 2 and p[0] in ("I:", "LRA:", "Peak:"):
            out[p[0][:-1]] = float(p[1])
    return out


# ── bed analysis (re-cut mode) ────────────────────────────────────────────────────────────────────────────────
def onset_envelope(x):
    """Log spectral flux: 1024-sample frames, 256 hop (5.3 ms), at 48 kHz. Returns (times, strength)."""
    N, H = 1024, 256
    win = np.hanning(N).astype(np.float32)
    nfr = 1 + (len(x) - N) // H
    prev, flux = None, np.zeros(nfr)
    for c0 in range(0, nfr, 4096):
        idx = np.arange(N)[None, :] + H * np.arange(c0, min(nfr, c0 + 4096))[:, None]
        L = np.log1p(1000 * np.abs(np.fft.rfft(x[idx].astype(np.float32) * win, axis=1)))
        d = np.diff(L, axis=0, prepend=L[:1] if prev is None else prev[None, :])
        flux[c0:c0 + len(L)] = np.maximum(0, d).sum(axis=1)
        prev = L[-1]
    t = (np.arange(nfr) * H + N / 2) / SR
    k = int(round(1.0 * SR / H))  # remove the slow trend (1 s)
    return t, np.maximum(0, flux - np.convolve(flux, np.ones(k) / k, mode="same"))


def beat_grid(t, o, lo_bpm=60, hi_bpm=140):
    """Constant-tempo grid (period, phase) that best lines up with the onsets: candidate periods from the onset
    autocorrelation, each refined by a fine comb search over period and phase; the best-scoring comb wins."""
    dt = t[1] - t[0]
    z = o - o.mean()
    ac = np.fft.irfft(np.abs(np.fft.rfft(z, 2 * len(z))) ** 2)[:len(z)]
    lags = np.arange(int(60 / hi_bpm / dt), int(60 / lo_bpm / dt) + 1)
    a = ac[lags]
    peaks = [i for i in range(1, len(a) - 1) if a[i] >= a[i - 1] and a[i] >= a[i + 1]]
    best = (-1.0, 0.0, 0.0)
    for i in sorted(peaks, key=lambda i: -a[i])[:5]:
        T0 = lags[i] * dt
        for T in np.arange(T0 - 0.004, T0 + 0.004, 0.0001):
            ph = np.arange(0, T, 0.001)
            k = np.arange(int((t[-1] - T) / T))
            s = np.interp(ph[:, None] + k[None, :] * T, t, o).mean(axis=1)
            j = int(s.argmax())
            if s[j] > best[0]:
                best = (float(s[j]), float(T), float(ph[j]))
    return best[1], best[2]


def find_build(x, t, o, T, phase):
    """The bed's build: the largest rise of the mean level (3 s after vs 3 s before, 0.25 s windows), refined to
    the strongest onset within half a second of it, then snapped to the nearest beat."""
    d = win_db(x)
    K = int(round(3.0 / WIN))
    hi = min(len(d) - K, int(min(90.0, len(x) / SR / 2) / WIN))
    b = np.arange(K, hi)
    score = np.array([d[i:i + K].mean() - d[i - K:i].mean() for i in b])
    tb = b[int(score.argmax())] * WIN
    near = (t >= tb - 0.5) & (t <= tb + 0.5)
    t_on = float(t[near][int(o[near].argmax())])
    return phase + round((t_on - phase) / T) * T, tb, t_on, float(score.max())


def snap(x, T, phase):
    return phase + round((x - phase) / T) * T


def plan_recut(music, title, total):
    x = decode(music)
    dur = len(x) / SR
    t, o = onset_envelope(x)
    T, phase = beat_grid(t, o)
    build, tb, t_on, rise = find_build(x, t, o, T, phase)
    off = title - build                                     # film time of the bed's 0:00
    blk = win_db(x, 0.01)
    first = float(np.argmax(blk > -60) * 0.01)              # the bed's first audible moment (bed time)
    t_s = snap(dur - MUSIC_TAIL, T, phase)                  # tail source start, on the grid
    h = snap(total + TAIL_SLACK - (dur - t_s) - off, T, phase)  # crossfade start (bed time), on the same grid
    p = dict(dur=dur, T=T, phase=phase, build=build, tb=tb, t_on=t_on, rise=rise, off=off, first=first,
             t_s=t_s, h=h, xf_film=off + h, tail_end=off + h + dur - t_s)
    print(f"bed: {os.path.relpath(music, FILM)} {dur:.2f} s, beat grid {60 / T:.2f} BPM (beat {T:.4f} s, phase "
          f"{phase:.3f} s)")
    print(f"bed: build at {build:.3f} s in the bed (rise of {rise:.1f} dB at {tb:.2f} s, onset {t_on:.3f} s, "
          f"snapped to beat {round((build - phase) / T)})")
    print(f"bed: offset {off:+.3f} s, so the build lands on cut.title {title:.2f} s; first audible at "
          f"{max(0.0, off + first):.2f} s film time, {FADE_IN:.0f} s fade-in")
    print(f"bed: head = bed 0.00-{h + XF:.3f} s; crossfade {XF:.0f} s from film {off + h:.3f} s (head beat "
          f"{round((h - phase) / T)}) into bed {t_s:.3f} s (beat {round((t_s - phase) / T)}); the bed ends at film "
          f"{p['tail_end']:.2f} s ({p['tail_end'] - total:+.2f} s after the end)")
    return p


# ── ffmpeg graphs ─────────────────────────────────────────────────────────────────────────────────────────────
def peak_time(path, cache={}):
    if path not in cache:
        cache[path] = float(np.argmax(np.abs(decode(path)))) / SR
    return cache[path]


def placed(label_in, at, label_out, pre=""):
    """Place a 48 kHz mono stream at film time `at` (trimming its head if `at` is negative)."""
    chain = f"{label_in}aformat=sample_fmts=fltp:sample_rates={SR}:channel_layouts=mono{pre}"
    if at < 0:
        chain += f",atrim=start_sample={int(round(-at * SR))},asetpts=N/SR/TB"
        at = 0.0
    return chain + f",adelay={int(round(at * SR))}S:all=1{label_out}"


def bus(labels, n, out):
    if not labels:
        return f"anullsrc=r={SR}:cl=mono,atrim=end_sample={n}{out}"
    return f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:dropout_transition=0,apad,atrim=end_sample={n}{out}"




def build_graph(tl, music, scored, plan):
    n = int(round(tl["total"] * SR))
    inputs, parts, vo, fx = [], [], [], []
    for i, v in enumerate(tl["vo"]):
        inputs += ["-i", R(v["file"])]
        parts.append(placed(f"[{len(inputs) // 2 - 1}:a]", v["start"], f"[v{i}]"))
        vo.append(f"[v{i}]")
    for j, s in enumerate(tl["sfx"]):
        f = R("assets", "sfx", s["f"] + ".mp3")
        inputs += ["-i", f]
        at = s["at"] + (1 / FPS - peak_time(f) if s.get("align") == "peak" else 0.0)
        parts.append(placed(f"[{len(inputs) // 2 - 1}:a]", at, f"[f{j}]", f",volume={s['vol']}"))
        fx.append(f"[f{j}]")
    inputs += ["-i", music]
    m = f"[{len(inputs) // 2 - 1}:a]aformat=sample_fmts=fltp:sample_rates={SR}:channel_layouts=mono"
    if scored:
        if plan["dur"] > tl["total"] + 0.01:
            m += f",atrim=end_sample={n},afade=t=out:st={tl['total'] - SCORED_FADE:.6f}:d={SCORED_FADE}"
        parts.append(f"{m},{CARVE},apad,atrim=end_sample={n}[bed]")
    else:
        p = plan
        parts.append(f"{m},asplit=2[ma][mb]")
        parts.append(f"[ma]atrim=end_sample={int(round((p['h'] + XF) * SR))},asetpts=N/SR/TB[mh]")
        parts.append(f"[mb]atrim=start_sample={int(round(p['t_s'] * SR))},asetpts=N/SR/TB[mt]")
        fade_at = max(p["first"], -p["off"])  # bed time where it first sounds in the film
        place = (f"atrim=start_sample={int(round(-p['off'] * SR))},asetpts=N/SR/TB" if p["off"] < 0
                 else f"adelay={int(round(p['off'] * SR))}S:all=1")
        parts.append(f"[mh][mt]acrossfade=d={XF}:c1=tri:c2=tri,{CARVE},afade=t=in:st={fade_at:.6f}:d={FADE_IN},"
                     f"{place},apad,atrim=end_sample={n}[bed]")
    parts.append(bus(vo, n, "[vosum]"))
    parts.append(f"[vosum]asplit=2[voraw][vin];[vin]{VOICE_CHAIN}[vo]")
    parts.append(bus(fx, n, "[fx]"))
    return inputs, ";".join(parts)


# ── ducking ───────────────────────────────────────────────────────────────────────────────────────────────────
def duck_envelope(vo, n):
    """Per-sample gain in dB (0 = up, -DUCK_DB = down) from the narration windows, and the open gaps."""
    regions = []
    for s, e in sorted((v["start"], v["start"] + v["dur"]) for v in vo):
        if regions and s - regions[-1][1] <= GAP_MIN:
            regions[-1][1] = max(regions[-1][1], e)
        else:
            regions.append([s, e])
    cr = 1000.0                                             # control rate; the ramps are smooth at this rate
    tc = np.arange(int(n / SR * cr) + 2) / cr
    sm = lambda u: 0.5 - 0.5 * np.cos(np.pi * np.clip(u, 0, 1))  # raised-cosine ramp, in dB
    duck = np.zeros_like(tc)
    for s, e in regions:
        duck = np.maximum(duck, sm((tc - (s - PRE)) / RAMP) * (1 - sm((tc - e) / RAMP)))
    gaps = [(regions[i][1], regions[i + 1][0]) for i in range(len(regions) - 1)]
    return np.interp(np.arange(n) / SR, tc, -DUCK_DB * duck), regions, gaps


def duck_and_level(tl, voice, bed):
    n = len(bed)
    env, regions, gaps = duck_envelope(tl["vo"], n)
    ducked = bed * 10 ** (env / 20)
    v, b, b0 = win_db(voice), win_db(ducked), win_db(bed)
    m = int(round(WIN * SR))
    up = env[:len(v) * m].reshape(len(v), m).min(axis=1) > -0.01   # windows where the bed is fully up
    speech = v > SPEECH_DB
    present = b0 > -70
    vmed = float(np.median(v[speech]))
    under = speech & present
    open_ = up & ~speech & present
    gain = 0.0
    if under.any():  # aim the median under speech at UNDER_VOICE_DB; if there are enough open-gap windows, split
        gain = vmed + UNDER_VOICE_DB - float(np.median(b[under]))  # the difference with GAP_VOICE_DB (within 1 dB)
        if open_.sum() >= 8:
            g2 = vmed + GAP_VOICE_DB - float(np.median(b[open_]))
            gain = float(np.clip((gain + g2) / 2, gain - 1.0, gain + 1.0))
    st = dict(vmed=vmed, gain=gain, under=float(np.median(b[under])) + gain - vmed if under.any() else None,
              gaps=float(np.median(b[open_])) + gain - vmed if open_.any() else None, n_under=int(under.sum()),
              n_gaps=int(open_.sum()), regions=regions, open=gaps)
    return ducked * 10 ** (gain / 20), st


# ── main ──────────────────────────────────────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="Mix the film's sound from the build timeline.")
    ap.add_argument("--timeline", default=R("build", "timeline.json"), help="default: build/timeline.json")
    ap.add_argument("--music", default=R("audio", "music.mp3"), help="default: audio/music.mp3")
    ap.add_argument("--scored", action="store_true",
                    help="the music was composed to the film's cuts: play it from 0:00, no re-cut, no crossfade")
    ap.add_argument("mux", nargs="*", metavar="video.mp4 out.mp4", help="also mux the mix onto this picture")
    a = ap.parse_args()
    if len(a.mux) not in (0, 2):
        ap.error("give both a video and an output path, or neither")
    tl = json.load(open(a.timeline))
    total = tl["total"]
    music = os.path.abspath(a.music)
    if a.scored:
        plan = dict(dur=len(decode(music)) / SR)
        print(f"bed: {os.path.relpath(music, FILM)} {plan['dur']:.2f} s, scored: from 0:00, "
              + (f"trimmed to {total:.2f} s with a {SCORED_FADE} s fade" if plan["dur"] > total + 0.01
                 else f"padded with silence to {total:.2f} s"))
    else:
        plan = plan_recut(music, tl["cut"]["title"], total)
    inputs, graph = build_graph(tl, music, a.scored, plan)
    os.makedirs(R("renders", "stems"), exist_ok=True)
    stem = lambda k: R("renders", "stems", k + ".wav")
    with tempfile.TemporaryDirectory(prefix=".mix-", dir=R("renders")) as tmp:
        T = lambda k: os.path.join(tmp, k + ".f32")
        out_raw = lambda lab, k: ["-map", lab, "-f", "f32le", "-c:a", "pcm_f32le", T(k)]
        run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph, *out_raw("[vo]", "voice"),
             *out_raw("[voraw]", "voraw"), *out_raw("[bed]", "bed"), *out_raw("[fx]", "sfx")])
        raw, chained = ebur128(T("voraw"), raw=True), ebur128(T("voice"), raw=True)
        print(f"voice chain: I {raw['I']:.1f} -> {chained['I']:.1f} LUFS, LRA {raw['LRA']:.1f} -> "
              f"{chained['LRA']:.1f} LU, true peak {raw['Peak']:.1f} -> {chained['Peak']:.1f} dBFS")
        voice = np.fromfile(T("voice"), np.float32).astype(np.float64)
        bed = np.fromfile(T("bed"), np.float32).astype(np.float64)
        mus, st = duck_and_level(tl, voice, bed)
        mus.astype(np.float32).tofile(T("music"))
        print(f"duck: {DUCK_DB:.0f} dB under every take; bed back up in {len(st['open'])} gaps: "
              + ", ".join(f"{s:.2f}-{e:.2f}" for s, e in st["open"]))
        print(f"level: bed {st['gain']:+.1f} dB; voice median speech {st['vmed']:.1f} dBFS; music under speech "
              f"{st['under']:+.1f} dB (n={st['n_under']}), in open gaps "
              + (f"{st['gaps']:+.1f} dB (n={st['n_gaps']})" if st["gaps"] is not None else "n/a")
              + " relative to it (0.25 s windows)")
        sfx = np.fromfile(T("sfx"), np.float32)
        for k, x in (("voice", voice), ("music", mus), ("sfx", sfx)):
            if np.abs(x).max() >= 1.0:
                print(f"warning: the {k} stem peaks at {20 * np.log10(np.abs(x).max()):+.1f} dBFS and will clip as 16-bit")
        pre = os.path.join(tmp, "pre.wav")
        RAW_IN = ["-f", "f32le", "-ar", str(SR), "-ac", "1"]
        run(["ffmpeg", "-v", "error", "-y", *RAW_IN, "-i", T("voice"), *RAW_IN, "-i", T("music"), *RAW_IN, "-i", T("sfx"),
             "-filter_complex", "[0:a][1:a][2:a]amix=inputs=3:normalize=0[mix]",
             "-map", "[mix]", "-ar", "48000", "-ac", "2", "-c:a", "pcm_f32le", pre,
             "-map", "0:a", "-ar", "48000", stem("voice"),
             "-map", "1:a", "-ar", "48000", stem("music"),
             "-map", "2:a", "-ar", "48000", stem("sfx")])
        # loudness, pass 1: measure; pass 2: apply linearly
        err = run(["ffmpeg", "-v", "info", "-y", "-i", pre, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json",
                   "-f", "null", "-"])
        meas = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
        ln = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:"
              f"measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:"
              f"offset={meas['target_offset']}:linear=true:print_format=json")
        out = R("renders", "mix.wav")
        err = run(["ffmpeg", "-v", "info", "-y", "-i", pre, "-af", ln + ",aresample=48000", "-ar", "48000", out])
        mode = json.loads(err[err.rindex("{"):err.rindex("}") + 1])["normalization_type"]
        print(f"loudnorm: in {meas['input_i']} LUFS / {meas['input_tp']} dBTP, pass 2 ran {mode}")
    err = run(["ffmpeg", "-v", "info", "-i", out, "-af", "ebur128=peak=true", "-f", "null", "-"])
    summary = [l.strip() for l in err.splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))]
    print("mix:", out, "|", " ".join(summary[-3:]))
    if a.mux:
        video, dst = a.mux
        tmp = dst + ".part.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", out, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
             "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", tmp])
        os.replace(tmp, dst)
        print("muxed:", dst)


if __name__ == "__main__":
    main()
