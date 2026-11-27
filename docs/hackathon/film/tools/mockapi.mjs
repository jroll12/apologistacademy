// Serves the built app (dist/) and replays one conversation through the same /api routes the real server has,
// streaming the skeptic's text in small pieces the way the live site does. For filming only.
//   node docs/hackathon/film/tools/mockapi.mjs <conversation.json> [port]
// conversation.json: { skeptic: [opening, reply1..reply5], coach: {nudge, outline, sample}, review: {covered, couldAdd, possibleAnswer} }
// Timing via env: THINK_MS (before the first piece), RATE (characters per second), COACH_MS, REVIEW_MS.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../../..');
const DIST = path.join(ROOT, 'dist');
const conv = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const PORT = Number(process.argv[3] || 5300);
const env = (k, d) => Number(process.env[k] || d);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

const readBody = async (req) => { let s = ''; for await (const c of req) s += c; try { return JSON.parse(s || '{}'); } catch { return {}; } };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/status') return res.writeHead(200, { 'content-type': 'application/json' }).end('{"live":true}');
  if (url.pathname === '/api/skeptic') {
    const b = await readBody(req);
    const n = (b.messages || []).filter((m) => m.from === 'me').length;
    const text = conv.skeptic[Math.min(n, conv.skeptic.length - 1)];
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    await sleep(env('THINK_MS', 1400));
    const rate = env('RATE', 150);
    const pieces = text.match(/\S+\s*/g) || [text];
    for (const p of pieces) { res.write(p); await sleep((p.length / rate) * 1000); }
    return res.end();
  }
  if (url.pathname === '/api/coach') { await readBody(req); await sleep(env('COACH_MS', 900)); return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(conv.coach)); }
  if (url.pathname === '/api/review') { await readBody(req); await sleep(env('REVIEW_MS', 2600)); return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(conv.review)); }
  let file = path.join(DIST, decodeURIComponent(url.pathname));
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`film mock on http://localhost:${PORT} (${process.argv[2]})`));
