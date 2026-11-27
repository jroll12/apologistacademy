#!/usr/bin/env node
// Builds the Apologist Academy film from the narration's word times: every scene cut, camera move, callout,
// caption and sound is stamped from build/takes.json, so a new take is one `node tools/build.mjs` away.
// Inputs: script.json, build/takes.json (tools/timing.py), capture/*.marks.json (tools/clips.py).
// Outputs: compositions/*.html, index.html, build/timeline.json (for tools/mix.py and the captions file).
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const wr = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p), s);
};
const r3 = (x) => Math.round(x * 1000) / 1000;
const round = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === "number" ? r3(v) : v)));

const script = JSON.parse(rd("script.json"));
const takes = JSON.parse(rd("build/takes.json"));
const M = { phone: JSON.parse(rd("capture/phone.marks.json")), laptop: JSON.parse(rd("capture/laptop.marks.json")), tablet: JSON.parse(rd("capture/tablet.marks.json")) };

// ── narration layout: each take starts after a gap (seconds of picture before it) ─────────────────────────────
const GAP = { open: 0.9, freeze: 2.7, verse: 1.0, intro: 1.1, demo: 0.45, coach: 0.6, personal: null, review: 0.5, trust: 2.4, hood: 0.7, close: 1.0 };
const TAIL = 3.8;
const E1_RATE = 4.0; // reply 2 is typed on fast-forward
const S2_RATE = 1.3; // the personal answer streams a little fast until its first line is on screen
const S2_READ = 2.7; // media seconds after skeptic2 when "Someone close to me..." is on screen
const ph = M.phone;
const L = {};
const vo = [];
let t = 0;
for (const tk of script.takes) {
  const k = takes[tk.id];
  let gap = GAP[tk.id];
  if (tk.id === "personal") {
    // after Coach closes: reply 2 typed at E1_RATE, then the skeptic's personal answer streams; the voice comes in
    // as the first line of the answer is on screen (the pull-quote lands with it)
    const e1 = (ph.skeptic2 + 0.15 - ph.reply2) / E1_RATE;
    gap = 0.35 + e1 + (S2_READ - 0.1) / S2_RATE + 0.25;
  }
  t += gap;
  vo.push({ take: tk.id, file: `assets/vo/${tk.id}.wav`, start: r3(t), dur: k.dur });
  for (const [id, ln] of Object.entries(k.lines)) {
    L[id] = { start: t + ln.start, end: t + ln.end, words: ln.words.map((w) => ({ w: w.w, start: t + w.start, end: t + w.end })) };
  }
  t += k.dur;
}
const TK = Object.fromEntries(vo.map((v) => [v.take, { start: v.start, end: v.start + v.dur }]));
const total = r3(t + TAIL);
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
function W(id, word, occ = 1) {
  let n = 0;
  for (const w of L[id].words) if (norm(w.w) === norm(word) && ++n === occ) return w.start;
  throw new Error(`"${word}" not found in ${id}`);
}
const WE = (id, word, occ = 1) => { let n = 0; for (const w of L[id].words) if (norm(w.w) === norm(word) && ++n === occ) return w.end; throw new Error(`"${word}" not in ${id}`); };

// ── scene cuts ────────────────────────────────────────────────────────────────────────────────────────────────
const cut = {};
cut.cold = 0;
cut.gap = L.L4.start - 0.35;
cut.verse = TK.verse.start - 0.5;
cut.title = TK.intro.start - 0.55;
cut.demo = L.L8.start - 0.3;
cut.screens = L.L16.start - 0.2;
cut.safe = TK.trust.start - 0.4;
cut.hood = TK.hood.start - 0.4;
cut.who = L.L20.start - 0.3;
cut.close = TK.close.start - 0.7;
const order = ["cold", "gap", "verse", "title", "demo", "screens", "safe", "hood", "who", "close"];
const span = (id) => { const i = order.indexOf(id); return [cut[id], i + 1 < order.length ? cut[order[i + 1]] : total]; };
const loc = (id, x) => r3(x - cut[id]);

// ── cold open (and the bookend reuses its phone) ──────────────────────────────────────────────────────────────
const cold = {};
cold.msg = 0.35;
cold.draftA = L.L2.end + 0.35; // after "What do you type back?" the reader starts a reply, and deletes it
cold.draftB = cold.draftA + 1.75;
cold.blank = cold.draftB + 0.98;
cold.pull = W("L3", "freeze") - 0.35;
cold.freeze = W("L3", "freeze");
cold.practiced = W("L3", "practiced");
cold.pushes = W("L3", "pushes");
cold.toBar = L.L2.end - 0.15; // the camera reaches the reply field as the first draft starts
cold.exit = cut.gap - 0.2;
for (const k in cold) cold[k] = loc("cold", cold[k]);
const coldDraft = { A: "Well, everything happens for a reason", B: "God has a plan, and" };
const COLD_DUR = { typeA: 1.0, delAt: 1.25, delA: 0.35, typeB: 0.55, delBt: 0.7, delB: 0.25 };

const gap = {
  pilots: W("L4", "Pilots"), sim: W("L4", "simulators"), surgeons: W("L4", "Surgeons"), models: W("L4", "models"),
  christians: W("L4", "Christians"), q: W("L4", "practice", 2), exit: cut.verse - 0.1,
};
for (const k in gap) gap[k] = loc("gap", gap[k]);

const verseWords = L.L5.words.slice(2).map((w) => loc("verse", w.start)); // "Peter wrote," is not on screen
const verse = { words: verseWords, peter: loc("verse", L.L5.start), ref: loc("verse", WE("L5", "respect")) , out: loc("verse", L.L6.start - 0.35), prepared: loc("verse", L.L6.start), practice: loc("verse", W("L6", "practice")), exit: loc("verse", cut.title - 0.2) };

const title = { so: loc("title", L.L7.start), built: loc("title", W("L7", "built")), name: loc("title", W("L7", "Apologist")), safe: loc("title", W("L7", "safe")), real: loc("title", W("L7", "real")), exit: loc("title", cut.demo - 0.4) };

// ── demo: one continuous phone, footage cut into segments with their own speeds ───────────────────────────────
const D0 = cut.demo;
const segs = [];
const seg = (from, to, at, dur) => { segs.push({ from, to, at, dur, rate: (to - from) / dur }); return at + dur; };
let at = 0;
at = seg(ph.home - 0.05, ph["tap-question"] + 0.85, at, L.L9.start - 0.25 - D0 - at);
at = seg(ph["tap-question"] + 0.85, ph.start + 0.75, at, L.L10.start - 0.2 - D0 - at);
at = seg(ph.start + 0.75, ph.coach - 0.1, at, TK.coach.start - 0.3 - D0 - at);
at = seg(ph.coach - 0.1, ph.reply2 - 0.05, at, TK.coach.end + 0.35 - D0 - at);
at = seg(ph.reply2 - 0.05, ph.skeptic2 + 0.1, at, (ph.skeptic2 + 0.15 - ph.reply2) / E1_RATE);
at = seg(ph.skeptic2 + 0.1, ph.skeptic2 + S2_READ, at, (S2_READ - 0.1) / S2_RATE);
at = seg(ph.skeptic2 + S2_READ, ph.fast - 0.2, at, TK.review.start - 0.4 - D0 - at);
const PH_HANDOFF = ph.end - 1.3; // the screens scene's phone carries on playing from here (match cut)
at = seg(ph["review-wait"] - 0.1, PH_HANDOFF, at, cut.screens - D0 - at);
const m2l = (mt) => { for (const s of segs) if (mt >= s.from - 1e-6 && mt <= s.to + 1e-6) return s.at + (mt - s.from) / s.rate; throw new Error(`media ${mt} not in any segment`); };
// camera: [local time, focus x, focus y (app pixels on the 390 x 844 screen), scale, move seconds]
const dl = (x) => r3(x - D0);
const FIN = dl(cut.screens) - 0.8; // back to the full phone for the match cut into the three screens
const cam = [
  [0, 195, 430, 1.0, 0.01],
  [m2l(ph.chips) - 0.4, 195, 430, 1.06, 2.6],
  [m2l(ph.prebrief) + 0.15, 195, 300, 1.45, 0.6],
  [m2l(ph.start) - 0.1, 195, 430, 1.2, 0.55],
  [m2l(ph.talk) + 0.5, 195, 260, 1.45, 0.6],
  [m2l(ph.reply1) - 0.25, 195, 620, 1.45, 0.6],
  [m2l(ph.skeptic1) + 0.3, 195, 470, 1.4, 0.6],
  [m2l(ph.coach) + 0.25, 195, 520, 1.3, 0.6],
  [m2l(ph.back) + 0.1, 195, 470, 1.2, 0.55],
  [m2l(ph.reply2) + 0.1, 195, 650, 1.5, 0.55, 960],
  [m2l(ph.skeptic2) + 0.35, 195, 520, 1.5, 0.7, 960],
  [m2l(ph["review-wait"]) + 0.02, 195, 430, 1.08, 0.6],
  [m2l(ph.review) + 1.3, 195, 330, 1.35, 0.7],
  [m2l(ph.conversation) - 0.6, 195, 560, 1.25, 0.7],
  [FIN, 195, 430, 1.0, 0.7],
].map((c) => c.map(r3));
const demo = {
  cam,
  pickIn: dl(L.L8.start), q16: dl(W("L8", "sixteen")), t8: dl(W("L8", "eight")), noAcct: dl(W("L8", "No", 1)), install: dl(W("L8", "install")),
  pickOut: dl(L.L9.start - 0.3),
  who: dl(L.L9.start), curious: dl(W("L9", "Curious")), hostile: dl(W("L9", "Hostile")), set: dl(W("L9", "set")),
  skOut: dl(L.L10.start - 0.3),
  turns: dl(W("L10", "five")), speak: dl(W("L10", "speak")), answers: dl(W("L11", "answers")), tougher: dl(W("L11", "tougher")),
  talkOut: dl(TK.coach.start - 0.35),
  stuck: dl(L.L12.start), hint: dl(W("L12", "hint")), outline: dl(W("L12", "outline")), sample: dl(W("L12", "sample")), own: dl(W("L12", "own")),
  coachOut: dl(TK.coach.end + 0.3),
  quote: m2l(ph.skeptic2 + S2_READ) + 0.05, center: m2l(ph.reply2) + 0.1, debate: dl(W("L13", "debate")), person: dl(W("L13", "person")),
  personalOut: dl(TK.review.start - 0.45),
  review: dl(L.L14.start), covered: dl(W("L14", "covered")), add: dl(W("L14", "add")), verseW: dl(W("L14", "verse")), scores: dl(W("L14", "scores")),
  print: dl(W("L15", "Print")), replace: dl(W("L15", "replace")), ready: dl(W("L15", "ready")),
  exit: dl(cut.screens - 0.3), fin: FIN,
  open: r3(Math.max(m2l(ph.talk + 2.6), dl(W("L10", "five")) + 0.9)), script: dl(L.L11.start), coachTap: r3(m2l(ph.coach)),
};
demo.quote = r3(demo.quote);
const clipTags = segs.map((s, i) => `        <video id="dm-v${i + 1}" class="clip" src="assets/clips/phone.mp4" data-start="${r3(s.at)}" data-duration="${r3(s.dur)}" data-media-start="${r3(s.from)}" data-playback-rate="${r3(s.rate)}" muted playsinline></video>`).join("\n");

const screens = { title: loc("screens", L.L16.start), exit: loc("screens", cut.safe - 0.2) };
const lap = M.laptop, tab = M.tablet;
screens.lapMedia = r3(lap.coach - 1.0);
screens.tabMedia = r3(tab.home + 0.2);
screens.phoneMedia = r3(PH_HANDOFF);
screens.carry = 0.9; // the phone travels from the demo framing to its place in the trio

const safe = { kick: loc("safe", L.L17.start), labeled: loc("safe", W("L17", "labeled")), converted: loc("safe", W("L17", "converted")), insults: loc("safe", W("L17", "insults")), crisis: loc("safe", W("L18", "crisis")), help: loc("safe", W("L18", "help")), verse: loc("safe", W("L18", "verse")), sources: loc("safe", W("L18", "sources")), exit: loc("safe", cut.hood - 0.2) };
const hood = { browser: loc("hood", L.L19.start), server: loc("hood", W("L19", "server")), five: loc("hood", W("L19", "five")), instr: loc("hood", W("L19", "instructions")), limit: loc("hood", W("L19", "limit")), platform: loc("hood", W("L19", "Apologist")), skeptic: loc("hood", W("L19", "plays")), coach: loc("hood", W("L19", "Coach")), memory: loc("hood", W("L19", "memory")), exit: loc("hood", cut.who - 0.2) };
const who = { groups: loc("who", W("L20", "groups")), students: loc("who", W("L20", "students")), believers: loc("who", W("L20", "believers")), leaders: loc("who", W("L20", "leaders")), exit: loc("who", cut.close - 0.1) };
const close = {
  phone: 0.0, type: loc("close", L.L21.start - 0.5), send: loc("close", W("L21", "freeze") + 0.35), respect: loc("close", W("L21", "respect")),
  card: loc("close", L.L22.start - 0.35), url: loc("close", W("L22", "Try")), qr: loc("close", W("L22", "Try") + 0.5),
};

// ── captions: the script's phrases, timed by the first word of each ──────────────────────────────────────────
const NO_CAP = new Set(["L5", "L6", "L22"]); // on screen already (the verse, its line, the end card)
const caps = [];
for (const ln of script.lines) {
  if (NO_CAP.has(ln.id) || !ln.cap) continue;
  const words = L[ln.id].words;
  let wi = 0;
  const parts = ln.cap.split(" / ");
  parts.forEach((p, i) => {
    const n = p.split(/\s+/).filter(Boolean).length;
    const ws = words.slice(wi, wi + n);
    wi += n;
    if (!ws.length) return;
    caps.push({ text: p, start: ws[0].start - 0.08, end: ws[ws.length - 1].end + 0.25, line: ln.id });
  });
}
for (let i = 0; i < caps.length - 1; i++) if (caps[i].end > caps[i + 1].start - 0.03) caps[i].end = caps[i + 1].start - 0.03;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const capTags = caps.map((c, i) => `      <div id="cap-${i + 1}" class="clip cap" data-start="${r3(c.start)}" data-duration="${r3(c.end - c.start)}"><span>${esc(c.text)}</span></div>`).join("\n");

// ── sound effects (mixed by tools/mix.py, not by the renderer) ───────────────────────────────────────────────
const sfx = [];
const fx = (f, at, vol, align) => sfx.push(align ? { f, at: r3(at), vol, align } : { f, at: r3(at), vol });
// soft key ticks while text is typed (about 11 a second, a little uneven), and delete ticks while it is erased
const JIT = [0, 0.018, -0.012, 0.025, -0.02, 0.008, -0.006, 0.02];
const ticks = (t0, dur, rate, name, vol) => {
  const n = Math.max(2, Math.round(dur * rate));
  for (let k = 0; k < n; k++) fx(name === "key" ? `key-${1 + (k % 3)}` : name, t0 + (k / n) * dur + JIT[k % JIT.length], vol);
};
fx("notification", cold.msg, 0.32);
ticks(cold.draftA, COLD_DUR.typeA, 11, "key", 0.1);
ticks(cold.draftA + COLD_DUR.delAt, COLD_DUR.delA, 14, "delete", 0.09);
ticks(cold.draftB, COLD_DUR.typeB, 11, "key", 0.1);
ticks(cold.draftB + COLD_DUR.delBt, COLD_DUR.delB, 14, "delete", 0.09);
// cuts: three whoosh takes in rotation on the moves that carry; dip cuts (verse, bookend) stay dry
fx("whoosh-a", cut.gap - 0.12, 0.12);
fx("riser", cut.title + Math.max(0.4, title.so - 0.12) + 0.12, 0.16, "peak"); // swells into the ? becoming the mark
fx("impact", cut.title + Math.max(0.4, title.so - 0.12) + 0.12, 0.2, "peak");
fx("whoosh-b", cut.demo + 0.05, 0.12);
fx("whoosh-c", cut.screens + 0.05, 0.13);
fx("whoosh-a", cut.safe - 0.12, 0.11);
fx("whoosh-b", cut.hood + 0.05, 0.1);
fx("whoosh-c", cut.who - 0.12, 0.11);
for (const k of ["tap-topic", "tap-question", "start", "coach", "outline", "sample", "back"]) fx("click-soft", D0 + m2l(ph[k] + 0.36), 0.3);
fx("click-soft", D0 + m2l(ph.reply1 + 0.36), 0.22);
fx("pop-lo", D0 + demo.q16, 0.1);
fx("pop-lo", cut.gap + gap.q, 0.12);
for (const k of ["five", "instr", "limit"]) fx("pop-lo", cut.hood + hood[k] - 0.1, 0.08);
// the bookend: the reply is typed, sent, and the phone steps aside for the end card
const cT0 = Math.max(close.type, 0.75);
ticks(cut.close + cT0, close.send - cT0 - 0.15, 11, "key", 0.09);
fx("send", cut.close + close.send, 0.24);
fx("whoosh-b", cut.close + close.card - 0.1, 0.11);
// ── write ─────────────────────────────────────────────────────────────────────────────────────────────────────
const LIB = rd("src/lib.css");
const stamp = (id, T, extra = {}) => {
  let s = rd(`src/${id}.html`).replace("/*{{LIB}}*/", LIB).replace("/*{{T}}*/ {}", JSON.stringify(round(T)));
  for (const [k, v] of Object.entries(extra)) s = s.replace(`<!--{{${k}}}-->`, v);
  wr(`compositions/${id}.html`, s);
};

stamp("cold", { ...cold, draft: coldDraft, dur: COLD_DUR });
stamp("gap", gap);
stamp("verse", verse);
stamp("title", title);
stamp("demo", demo, { CLIPS: clipTags });
const scDur = r3(span("screens")[1] - span("screens")[0]);
const vtag = (id, f, ms) => `<video id="${id}" class="clip" src="assets/clips/${f}.mp4" data-start="0" data-duration="${scDur}" data-media-start="${ms}" muted playsinline></video>`;
stamp("screens", screens, { LAPV: vtag("sc-v1", "laptop", screens.lapMedia), TABV: vtag("sc-v2", "tablet", screens.tabMedia), PHV: vtag("sc-v3", "phone", screens.phoneMedia) });
stamp("safe", safe);
stamp("hood", hood);
stamp("who", who);
stamp("close", close);
// no burned-in captions (Jarret's call): the captions file for YouTube is written by tools/srt.py
stamp("bg", { cut, total, card: cut.close + close.card });
stamp("grain", { total });

// scenes alternate between tracks 1 and 2 so one can run on under the next one's entrance (OVER seconds)
const OVER = { title: 0.1 };
const host = (id) => {
  const i = order.indexOf(id);
  const [a, b] = span(id);
  const end = Math.min(total, b + (OVER[id] || 0));
  return `    <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${r3(a)}" data-duration="${r3(end - a)}" data-track-index="${1 + (i % 2)}" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index: ${2 + i}"></div>`;
};
const layer = (id, track, z) => `    <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="0" data-duration="${total}" data-track-index="${track}" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index: ${z}"></div>`;
wr("index.html", `<!doctype html>
<html lang="en" data-resolution="landscape">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #030712; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #030712; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1920" data-height="1080">
${layer("bg", 0, 0)}
${order.map((id) => host(id)).join("\n")}
${layer("grain", 3, 50)}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
wr("build/timeline.json", JSON.stringify(round({ total, cut, vo, sfx, caps, segs, lines: Object.fromEntries(Object.entries(L).map(([k, v]) => [k, { start: v.start, end: v.end }])) }), null, 1));
const t2 = (x) => { const d = Math.round(x * 10); return `${Math.floor(d / 600)}:${((d % 600) / 10).toFixed(1).padStart(4, "0")}`; };
console.log(`built ${t2(total)} · ` + order.map((id) => `${id} ${t2(cut[id])}`).join(" · "));
console.log("demo footage speeds: " + segs.map((s) => s.rate.toFixed(2)).join(", ") + ` · ${caps.length} captions · ${sfx.length} sounds`);
