// Run one real practice conversation on the live site and save exactly what the AI said.
//   node docs/hackathon/film/tools/live_capture.mjs [https://apologistacademy.pages.dev]
// Question: "Why does God allow suffering?", skeptic Balanced, Standard. The five replies are the ones in
// docs/hackathon/script-long.md. Coach is opened once, before reply 2. Uses about 8 of the site's daily live calls.
// Writes docs/hackathon/film/capture/live-capture.json (text only, read from the API responses themselves).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright'); // the preinstalled Playwright resolves this way, not via import

const SITE = (process.argv[2] || 'https://apologistacademy.pages.dev').replace(/\/$/, '');
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'capture');
const REPLIES = [
  "That's a fair question, and I don't want to give you a cheap answer. I think part of it is that God made a world where love is real, and real love needs real choices.",
  "You're right, that doesn't explain all of it. What I hold on to is that God didn't stay far from pain. In Jesus he stepped into it. Can I ask if this question is personal for you?",
  "If it is personal, I'm sorry. I don't know why God allows each thing. I do know Jesus wept at a friend's grave. Pain matters to him.",
  "I'd rather sit with you in it than explain it away.",
  "Mostly, I'd listen. And I'd say the cross means God knows suffering from the inside, and it won't have the last word.",
];

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
await p.addInitScript(() => localStorage.setItem('ap.practice.v1', JSON.stringify({ v: 1, seenIntro: true, suggestedId: 'suffering' })));

const status = await (await p.request.get(SITE + '/api/status')).json().catch(() => ({}));
if (status.live !== true) { console.error('Live AI is not on at', SITE, JSON.stringify(status)); process.exit(2); }

// Copy every AI response inside the page (a tee of the stream), so streamed text is saved whole.
await p.addInitScript(() => {
  window.__calls = [];
  const orig = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const api = new URL(url, location.href).pathname;
    const res = await orig(input, init);
    if (['/api/skeptic', '/api/coach', '/api/review'].includes(api) && res.body) {
      let sent = {};
      try { sent = JSON.parse(init?.body || '{}'); } catch {}
      const rec = { api, status: res.status, myRepliesSoFar: (sent.messages || []).filter((m) => m.from === 'me').length, body: '', done: false };
      window.__calls.push(rec);
      // Pass the stream through to the app unchanged, keeping a copy of every piece as it goes by.
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      const body = new ReadableStream({
        async pull(ctrl) {
          try {
            const { done, value } = await reader.read();
            if (done) { rec.body += dec.decode(); rec.done = true; rec.at = new Date().toISOString(); ctrl.close(); return; }
            rec.body += dec.decode(value, { stream: true });
            ctrl.enqueue(value);
          } catch (e) { rec.error = String(e); rec.done = true; ctrl.error(e); }
        },
        cancel(reason) { rec.error = 'cancelled: ' + reason; rec.done = true; return reader.cancel(reason); },
      });
      return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
    }
    return res;
  };
});
const calls = () => p.evaluate(() => window.__calls.filter((c) => c.done && !c.error && c.status === 200 && c.body && c.body.trim()));
const count = async (api) => new Set((await calls()).filter((c) => c.api === api).map((c) => c.myRepliesSoFar)).size;
const until = async (fn, ms = 90000) => { const t = Date.now(); while (!(await fn())) { if (Date.now() - t > ms) throw new Error('timed out'); await p.waitForTimeout(250); } };
const ready = () => p.waitForFunction(() => { const t = document.querySelector('textarea'); return t && !t.disabled; }, null, { timeout: 90000 });

await p.goto(SITE + '/practice/suffering');
await p.getByText('Balanced', { exact: true }).click();
await p.getByText('Standard', { exact: true }).click();
await p.getByRole('button', { name: 'Start', exact: true }).click();
await until(async () => (await count('/api/skeptic')) >= 1);
for (let i = 0; i < REPLIES.length; i++) {
  await ready();
  if (i === 1) {
    await p.getByRole('button', { name: 'Ask Apologist AI' }).click();
    await until(async () => (await count('/api/coach')) >= 1);
    await p.waitForTimeout(800);
    for (const name of ['Show outline', 'Show sample reply', 'Back to my reply']) {
      await p.getByRole('button', { name }).click().catch((e) => log('could not click', name, e.message));
      await p.waitForTimeout(600);
    }
    await ready();
  }
  await p.getByRole('textbox', { name: 'Your reply' }).fill(REPLIES[i]);
  await p.getByRole('button', { name: 'Send' }).click();
  if (i < REPLIES.length - 1) await until(async () => (await count('/api/skeptic')) >= i + 2);
}
await p.waitForURL(/\/review\//, { timeout: 120000 });
await until(async () => (await count('/api/review')) >= 1, 120000);
await p.waitForTimeout(4000); // let the skeptic's closing line finish too
await p.waitForTimeout(1500);
fs.mkdirSync(OUT, { recursive: true });
await p.screenshot({ path: path.join(OUT, 'live-review.png'), fullPage: true });

const all = await calls();
// One answer per turn: if a call was repeated, keep the last complete one.
const lastPer = (api) => Object.values(Object.fromEntries(all.filter((c) => c.api === api).map((c) => [c.myRepliesSoFar, c])));
const sk = lastPer('/api/skeptic').sort((a, b) => a.myRepliesSoFar - b.myRepliesSoFar).map((c) => c.body.trim());
const json = (c) => { try { return JSON.parse(c.body); } catch { return c.body; } };
const result = {
  capturedAt: new Date().toISOString(),
  site: SITE,
  question: 'Why does God allow suffering?',
  persona: 'balanced',
  difficulty: 'standard',
  note: 'Text copied from the live API responses during one real run. Nothing edited.',
  skeptic: sk,
  me: REPLIES,
  coach: lastPer('/api/coach')[0] ? json(lastPer('/api/coach')[0]) : null,
  coachBeforeReply: 2,
  review: lastPer('/api/review')[0] ? json(lastPer('/api/review')[0]) : null,
  calls: all,
};
fs.writeFileSync(path.join(OUT, 'live-capture.json'), JSON.stringify(result, null, 1));
log('saved', path.join(OUT, 'live-capture.json'), 'skeptic lines:', sk.length, 'coach:', !!result.coach, 'review:', !!result.review);
await b.close();
