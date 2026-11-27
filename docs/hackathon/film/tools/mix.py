"""The film's sound, mixed from build/timeline.json: Jason's takes where the build placed them, the ElevenLabs
music bed ducked under the voice, and the light sound effects. Loudness is set for YouTube (-14 LUFS integrated,
-1 dBTP), in two passes.

    python3 -I docs/hackathon/film/tools/mix.py [video.mp4 out.mp4]

Writes renders/mix.wav and stems (renders/stems/voice.wav, music.wav, sfx.wav). With a video and an output path,
also muxes the mix onto the picture without re-encoding it.

Music: the bed is 225 s; the film is shorter. It plays from its start, then crossfades (3 s) into the bed's last
30 s so its own ending (a lift, then a resolved fade) lands on the end card.
"""
import json, os, subprocess, sys

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda *p: os.path.join(FILM, *p)
tl = json.load(open(R("build", "timeline.json")))
TOTAL = tl["total"]
MUSIC_TAIL = 30.0   # seconds of the bed's ending to land on the end of the film
XF = 3.0            # crossfade into the ending
MUSIC_DB = -6.0     # bed level before ducking
os.makedirs(R("renders", "stems"), exist_ok=True)


def run(args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-2000:])
    return r.stderr


def build_graph():
    inputs, parts, vo_labels, fx_labels = [], [], [], []
    for i, v in enumerate(tl["vo"]):
        inputs += ["-i", R(v["file"])]
        ms = int(round(v["start"] * 1000))
        parts.append(f"[{i}:a]aformat=sample_rates=48000:channel_layouts=mono,adelay={ms}:all=1[v{i}]")
        vo_labels.append(f"[v{i}]")
    n = len(inputs) // 2
    for j, s in enumerate(tl["sfx"]):
        inputs += ["-i", R("assets", "sfx", s["f"] + ".mp3")]
        ms = int(round(max(0, s["at"]) * 1000))
        parts.append(f"[{n + j}:a]aformat=sample_rates=48000:channel_layouts=mono,volume={s['vol']},adelay={ms}:all=1[f{j}]")
        fx_labels.append(f"[f{j}]")
    m = len(inputs) // 2
    inputs += ["-i", R("audio", "music.mp3")]
    head = TOTAL - MUSIC_TAIL + XF + 0.6
    parts.append(f"[{m}:a]aformat=sample_rates=48000:channel_layouts=mono,asplit=2[ma][mb]")
    parts.append(f"[ma]atrim=0:{head:.3f},asetpts=N/SR/TB[mh]")
    parts.append(f"[mb]atrim=start={225 - MUSIC_TAIL:.3f},asetpts=N/SR/TB[mt]")
    parts.append(f"[mh][mt]acrossfade=d={XF}:c1=tri:c2=tri,volume={MUSIC_DB}dB,afade=t=in:d=1.2,apad,atrim=0:{TOTAL:.3f}[mus]")
    parts.append(f"{''.join(vo_labels)}amix=inputs={len(vo_labels)}:normalize=0:dropout_transition=0,apad,atrim=0:{TOTAL:.3f},asplit=3[vo][vok][vos]")
    parts.append(f"{''.join(fx_labels)}amix=inputs={len(fx_labels)}:normalize=0:dropout_transition=0,apad,atrim=0:{TOTAL:.3f},asplit=2[fx][fxs]")
    # duck the bed under the voice: about 10 dB less while Jason speaks, back up in the gaps
    parts.append("[mus][vok]sidechaincompress=threshold=0.015:ratio=8:attack=25:release=450:makeup=1,asplit=2[duck][ms]")
    parts.append("[vo][duck][fx]amix=inputs=3:normalize=0[mix]")
    return inputs, ";".join(parts)


def main():
    inputs, graph = build_graph()
    pre = R("renders", "mix-pre.wav")
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph,
         "-map", "[mix]", "-ar", "48000", "-ac", "2", pre,
         "-map", "[vos]", "-ar", "48000", R("renders", "stems", "voice.wav"),
         "-map", "[ms]", "-ar", "48000", R("renders", "stems", "music.wav"),
         "-map", "[fxs]", "-ar", "48000", R("renders", "stems", "sfx.wav")])
    # loudness, pass 1: measure; pass 2: apply linearly
    err = run(["ffmpeg", "-v", "info", "-y", "-i", pre, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"])
    meas = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
    ln = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:"
          f"measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:offset={meas['target_offset']}:linear=true")
    out = R("renders", "mix.wav")
    run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", ln + ",aresample=48000", "-ar", "48000", out])
    os.remove(pre)
    err = run(["ffmpeg", "-v", "info", "-i", out, "-af", "ebur128=peak=true", "-f", "null", "-"])
    summary = [l.strip() for l in err.splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))]
    print("mix:", out, "|", " ".join(summary[-3:]))
    if len(sys.argv) == 3:
        video, dst = sys.argv[1], sys.argv[2]
        tmp = dst + ".part.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", out, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
             "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", tmp])
        os.replace(tmp, dst)
        print("muxed:", dst)


if __name__ == "__main__":
    main()
