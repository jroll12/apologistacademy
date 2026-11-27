// Films the real app (served by mockapi.mjs) with Chrome's screencast: JPEG frames at quality 92, only when the
// screen changes, each with its own timestamp. Writes <out>/<device>/frames/*.jpg, frames.json and marks.json;
// clips.mjs turns them into 30 fps clips cut at the marks.
//   node docs/hackathon/film/tools/capture.mjs <out-dir> [phone|laptop|tablet] [port]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = process.argv[2];
const DEVICE = process.argv[3] || 'phone';
const PORT = process.argv[4] || 5300;
const SITE = `http://localhost:${PORT}`;
const DEV = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  laptop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  tablet: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}[DEVICE];
const REPLIES = [
  "That's a fair question, and I don't want to give you a cheap answer. I think part of it is that God made a world where love is real, and real love needs real choices.",
  "You're right, that doesn't explain all of it. What I hold on to is that God didn't stay far from pain. In Jesus he stepped into it. Can I ask if this question is personal for you?",
  "If it is personal, I'm sorry. I don't know why God allows each thing. I do know Jesus wept at a friend's grave. Pain matters to him.",
  "I'd rather sit with you in it than explain it away.",
  "Mostly, I'd listen. And I'd say the cross means God knows suffering from the inside, and it won't have the last word.",
];

const dir = path.join(OUT, DEVICE);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(path.join(dir, 'frames'), { recursive: true });
const b = await chromium.launch({ args: [`--force-device-scale-factor=${DEV.deviceScaleFactor}`] }); // without this flag the screencast arrives at CSS size
const ctx = await b.newContext({ ...DEV, colorScheme: 'dark', reducedMotion: 'no-preference' });
const p = await ctx.newPage();
await p.addInitScript(() => localStorage.setItem('ap.practice.v1', JSON.stringify({ v: 1, seenIntro: true, suggestedId: 'suffering' })));
// A touch marker: a soft ring where a finger (or the pointer) lands. Drawn by the page, so it is in the frames.
await p.addInitScript(() => {
  const css = `#film-touch{position:fixed;left:0;top:0;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.28);border:2px solid rgba(255,255,255,.85);box-shadow:0 0 0 6px rgba(143,97,255,.35);pointer-events:none;z-index:2147483647;opacity:0;transform:scale(.6);transition:opacity .18s ease, transform .22s cubic-bezier(.2,.8,.2,1)}#film-touch.on{opacity:1;transform:scale(1)}#film-touch.press{transform:scale(.82)}`;
  addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.append(s); const d = document.createElement('div'); d.id = 'film-touch'; document.body.append(d); });
});

const frames = [];
const marks = [];
const cdp = await ctx.newCDPSession(p);
let n = 0;
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const f = `f${String(n++).padStart(5, '0')}.jpg`;
  fs.writeFileSync(path.join(dir, 'frames', f), Buffer.from(data, 'base64'));
  frames.push({ f, t: metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
const now = () => Date.now() / 1000;
const mark = (label) => { marks.push({ label, t: now() }); console.log(label); };
const wait = (ms) => p.waitForTimeout(ms);

const touch = async (locator, { hold = 260, after = 200 } = {}) => {
  await locator.scrollIntoViewIfNeeded();
  const bx = await locator.boundingBox();
  const x = bx.x + bx.width / 2, y = bx.y + bx.height / 2;
  await p.evaluate(([x, y]) => { const d = document.getElementById('film-touch'); d.style.left = x + 'px'; d.style.top = y + 'px'; d.classList.add('on'); }, [x, y]);
  await wait(hold);
  await p.evaluate(() => document.getElementById('film-touch').classList.add('press'));
  await wait(90);
  if (DEV.hasTouch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y);
  await p.evaluate(() => document.getElementById('film-touch').classList.remove('press'));
  await wait(after);
  await p.evaluate(() => document.getElementById('film-touch').classList.remove('on'));
};
const smoothScroll = (y, ms = 900) => p.evaluate(([y, ms]) => new Promise((r) => { const y0 = scrollY, t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; scrollTo(0, y0 + (y - y0) * e); k < 1 ? requestAnimationFrame(step) : r(); }; requestAnimationFrame(step); }), [y, ms]);
const smoothScrollEl = (sel, x, ms = 1100) => p.evaluate(([sel, x, ms]) => new Promise((r) => { const el = document.querySelector(sel); const x0 = el.scrollLeft, t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; el.scrollLeft = x0 + (x - x0) * e; k < 1 ? requestAnimationFrame(step) : r(); }; requestAnimationFrame(step); }), [sel, x, ms]);
const ready = () => p.waitForFunction(() => { const t = document.querySelector('textarea'); return t && !t.disabled; }, null, { timeout: 60000 });
const typeReply = async (text, delay = 22) => {
  await ready();
  const box = p.getByRole('textbox', { name: 'Your reply' });
  await touch(box, { after: 120 });
  if (delay) await box.pressSequentially(text, { delay }); else await box.fill(text);
  await wait(450);
  await touch(p.getByRole('button', { name: 'Send' }));
};
const skepticDone = async (k) => {
  // wait until the k-th skeptic message is complete: the reply box is usable again (or the review page loads)
  await p.waitForFunction(() => { const t = document.querySelector('textarea'); return (t && !t.disabled) || location.pathname.startsWith('/review'); }, null, { timeout: 60000 });
};

await p.goto(SITE + '/');
await wait(800);
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1, maxWidth: DEV.viewport.width * DEV.deviceScaleFactor, maxHeight: DEV.viewport.height * DEV.deviceScaleFactor });
await wait(600);

if (DEVICE === 'phone') {
  mark('home');
  await wait(1800);
  await smoothScroll(330, 1300);
  mark('chips');
  await wait(500);
  const chipsSel = await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find((e) => e.scrollWidth > e.clientWidth + 40 && getComputedStyle(e).overflowX !== 'visible' && e.querySelectorAll('a[href*="topic="]').length >= 6); if (!el) return null; el.setAttribute('data-film', 'chips'); return '[data-film="chips"]'; });
  if (chipsSel) { await smoothScrollEl(chipsSel, 300, 1300); await wait(500); await smoothScrollEl(chipsSel, 0, 1000); }
  await wait(300);
  mark('tap-topic');
  await touch(p.locator('a[href="/questions?topic=suffering"]').first());
  await p.waitForURL(/questions/);
  await wait(1200);
  mark('tap-question');
  await touch(p.locator('a[href="/practice/suffering"]').last());
  await p.waitForURL(/practice/);
  mark('prebrief');
  await wait(900);
  await touch(p.getByText('Hostile', { exact: true }), { after: 500 });
  await touch(p.getByText('Balanced', { exact: true }), { after: 500 });
  await touch(p.getByText('Tough', { exact: true }), { after: 450 });
  await touch(p.getByText('Standard', { exact: true }), { after: 450 });
  mark('start');
  await touch(p.getByRole('button', { name: 'Start', exact: true }));
  await p.waitForURL(/talk/);
  mark('talk');
  await skepticDone(0);
  await wait(1500);
  mark('reply1');
  await typeReply(REPLIES[0]);
  mark('skeptic1');
  await skepticDone(1);
  await wait(1800);
  mark('coach');
  await touch(p.getByRole('button', { name: 'Ask Apologist AI' }));
  await p.getByRole('button', { name: 'Show outline' }).waitFor();
  await wait(2600);
  mark('outline');
  await touch(p.getByRole('button', { name: 'Show outline' }));
  await wait(2800);
  mark('sample');
  await touch(p.getByRole('button', { name: 'Show sample reply' }));
  await wait(3200);
  mark('back');
  await touch(p.getByRole('button', { name: 'Back to my reply' }));
  await wait(900);
  mark('reply2');
  await typeReply(REPLIES[1], 14);
  mark('skeptic2');
  await skepticDone(2);
  await wait(3500);
  mark('fast');
  for (const r of REPLIES.slice(2)) { await typeReply(r, 0); await skepticDone(); await wait(400); }
  mark('review-wait');
  await p.waitForURL(/review/, { timeout: 60000 });
  mark('review');
  await wait(3200);
  await smoothScroll(420, 1600);
  await wait(2200);
  await smoothScroll(900, 1600);
  await wait(1800);
  mark('conversation');
  const conv = p.getByText('Your conversation');
  await touch(conv, { after: 600 });
  await wait(1200);
  await smoothScroll(await p.evaluate(() => document.documentElement.scrollHeight), 2200);
  await wait(1800);
  mark('end');
}

if (DEVICE === 'laptop') {
  await p.goto(SITE + '/practice/suffering');
  await wait(700);
  mark('prebrief');
  await touch(p.getByText('Balanced', { exact: true }), { after: 300 });
  await touch(p.getByRole('button', { name: 'Start', exact: true }));
  await p.waitForURL(/talk/);
  mark('talk');
  await skepticDone();
  await wait(800);
  await typeReply(REPLIES[0], 10);
  mark('skeptic1');
  await skepticDone();
  await wait(900);
  mark('coach');
  await touch(p.getByRole('button', { name: 'Ask Apologist AI' }));
  await p.getByRole('button', { name: 'Show outline' }).waitFor();
  await wait(1500);
  await touch(p.getByRole('button', { name: 'Show outline' }));
  await wait(2500);
  mark('end');
}
if (DEVICE === 'tablet') {
  mark('home');
  await wait(1500);
  await smoothScroll(500, 1800);
  await wait(800);
  await touch(p.locator('a[href="/practice/suffering"]').first());
  await p.waitForURL(/practice/);
  mark('prebrief');
  await wait(1200);
  await touch(p.getByRole('button', { name: 'Start', exact: true }));
  await p.waitForURL(/talk/);
  mark('talk');
  await skepticDone();
  await wait(1500);
  mark('end');
}

await cdp.send('Page.stopScreencast');
await wait(300);
fs.writeFileSync(path.join(dir, 'frames.json'), JSON.stringify(frames));
fs.writeFileSync(path.join(dir, 'marks.json'), JSON.stringify(marks, null, 1));
console.log(`${frames.length} frames over ${(frames.at(-1).t - frames[0].t).toFixed(1)}s`);
await b.close();
