# Apologist Academy: practice conversations

Practice answering hard questions about the Christian faith. Pick a question, talk with a simulated skeptic for five turns, ask Coach for help in steps, and read a review at the end. No scores.

Built with the Apologist Project Design System, evolved from the "Practice conversation wireframes" design board.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

| Command          | What it does                                                          |
| ---------------- | --------------------------------------------------------------------- |
| `npm run check`  | Lint, typecheck, unit tests and build                                 |
| `npm test`       | Unit and component tests                                              |
| `npm run e2e`    | Browser tests (phone, desktop, live path, accessibility, screenshots) |
| `npm run format` | Format with Prettier                                                  |

The browser tests need Chromium once: `npx playwright install chromium`.

## Two modes

**Scripted (the default).** With no API key, the skeptic and Coach follow scripts in `src/data/scripts.ts`. A script cannot respond to what you say, so the review holds general notes and never claims to know what you covered. Skeptic styles are shown but switched off.

**Live AI.** With a key, a server function calls Claude. The skeptic responds to what you actually say and streams in, Coach helps with each reply, the review is personal, and skeptic styles work. The app asks the server which mode it is in. Nothing needs changing in the code.

### Switch live AI on

In Netlify, under **Site configuration → Environment variables**, add:

| Variable            | Needed | What it does                                                                               |
| ------------------- | ------ | ------------------------------------------------------------------------------------------ |
| `ANTHROPIC_API_KEY` | Yes    | Turns live AI on. It stays on the server and never reaches the browser.                    |
| `CLAUDE_MODEL`      | No     | Model id. Default `claude-opus-5-5`.                                                       |
| `LIVE_DAILY_LIMIT`  | No     | Live conversations one person may start per day. Default 10.                               |
| `LIVE_GLOBAL_LIMIT` | No     | Live conversations everyone together may start per day. Default 500. This bounds the bill. |

**Using an Apologist agent instead of Claude.** Set `APOLOGIST_API_URL` (the full chat-completions endpoint) and `APOLOGIST_API_KEY` instead of the Anthropic key. `APOLOGIST_MODEL` is optional. If both are set, the agent is used unless `AI_PROVIDER=anthropic`. This path sends an `x-api-key` header (and tries `Authorization: Bearer` if that is refused) and an OpenAI-style request with no agent memory, and asks for plain JSON from Coach and the review, which the server checks itself. It has only been tested against a local stand-in, not the real platform.

Redeploy after adding them. To try it locally, set `ANTHROPIC_API_KEY` before `npm run dev`. `MOCK_AI=1 npm run dev` runs the live path with a built-in fake model and no key.

**Try one real conversation before sharing a live link.** See "What has and has not been tested" below.

### Guardrails, enforced on the server

- The skeptic is a clearly simulated character, stays respectful, never claims to be converted, and says it is simulated if asked.
- Five turns per conversation, 600 characters per reply, and the daily caps above. The caps count conversations started, never replies.
- Coach and the review may quote only the one checked verse for the question. They may not name books, authors, websites or studies, and the review gives no scores.
- Sources shown in the review come only from the list in `src/data/questions.ts`. The model never supplies them.
- If the model declines a request for safety reasons, the API retries it on a fallback model in the same call.

## Content

All of it lives in `src/data/`.

- **`questions.ts`**: 16 questions in 8 topics. Each has a verse and a `sources` list.
- **`scripts.ts`**: for each question, the skeptic's opening and four follow-ups, Coach's nudge, outline and sample reply, and review notes.
- **`personas.ts`**: skeptic styles and difficulty levels, with the instruction each gives the live skeptic.

### The copy is a draft

Every script is marked `draft: true`. While a script is a draft, the app shows a "Draft copy" note wherever its text appears. The copy was written to the design system's voice rules and has **not** been reviewed for theology or tone. To approve a script, review it and set `draft: false`.

Strings marked `(board)` in `scripts.ts` come from the design board word for word.

### Scripture

Verses are quoted from the Berean Standard Bible and were checked word for word against the source text. The house translation is ESV. To use it, replace the `text` and `translation` in `questions.ts`.

### Sources

Every `sources` list is empty on purpose, and the review says "Sources to be added". No titles or links were invented. Add real ones like this:

```ts
sources: [{ title: 'Document title', publisher: 'Ministry partner', href: 'https://…' }],
```

### Add a question

1. Add it to `QUESTIONS` in `questions.ts` with a unique `id`, a topic, a verse and sources.
2. Add a script under the same `id` in `scripts.ts`.

`npm test` fails if a question has no script, if any copy contains an em dash, emoji, a banned filler word or a leftover placeholder, or if a source is missing a title, publisher or https link.

## What has and has not been tested

**Tested and passing**

- 113 unit and component tests: turn logic, the daily limit, saving and loading, search, the scripted provider, the server routes and their limits, and a full conversation in a simulated browser.
- 65 browser tests in Chromium at phone and desktop sizes: the full flow, resume after reload, Coach, history, search, the daily limit, keyboard-only use, focus handling, reduced motion, an automated accessibility scan (axe) on every screen, and a check that every control is at least 44px.
- The live path end to end against the built-in fake model: streaming, Coach, the personal review, styles, and request checks.
- The Claude adapter against a local stand-in for the API. This proves exactly what request is sent and that replies are read correctly.
- The Netlify function bundles and answers correctly when called directly.

**Not tested**

- **A real Claude reply.** No API key was available during development. The request has never been sent to the real API, so the first live conversation is its first real test.
- **Netlify hosting itself:** that `/api/*` reaches the function ahead of the page fallback, and the stored usage counter (Netlify Blobs). If Blobs is unavailable the counter falls back to memory, which resets when the function restarts.
- **Voice** with real audio. Speech input and read-aloud use the browser's own features. Firefox has no speech input, and the app says so.
- **Browsers other than Chromium**, and real phones.
- **Right-to-left languages.** Layout uses logical properties, but no RTL language has been tried.

## Known limits

- Conversations are saved in the browser on one device. There are no accounts and nothing syncs.
- The scripted daily limit (3 a day, set in `src/conversation/dailyLimit.ts`) is kept in the browser, so clearing site data resets it. The live limits are enforced on the server and are approximate under heavy simultaneous use.
- The wordmark is plain type and the Coach button uses a cross as a stand-in, because no logo file exists yet. Pass `src` to `Logo` when it does.

## Where things are

```
src/app/            app state: store, provider choice, starting conversations
src/conversation/   turn logic, the provider interface, scripted and live providers, daily limit
src/store/          saved data (versioned, in localStorage)
src/data/           questions, scripts, skeptic styles
src/components/     buttons, top bar, chat bubbles, composer, sheet, cards
src/screens/        Home, Library, Get ready, Conversation, Coach, Review, History
src/voice/          speech input and read-aloud
src/styles/ds/      Apologist design-system tokens, unchanged
server/             the API: prompts, limits, the Claude adapter, a fake model for tests
netlify/functions/  the Netlify entry point for the API
e2e/                browser tests
```

`src/conversation/provider.ts` is the seam between the app and whoever plays the skeptic. `server/anthropicClient.ts` is the only file that talks to the Anthropic SDK.
