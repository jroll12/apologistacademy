# Apologist Academy: practice conversations

A clickable prototype of the practice-conversation flow: pick a hard question, talk with a simulated skeptic for five turns, ask the Coach for stepped help, and read a review with no scores.

Built from the "Practice conversation wireframes" design board using the Apologist Project Design System.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # reducer, daily limit, browse filter
npm run build
```

Below 480px wide the app fills the screen. On wider screens it sits in a 390×844 phone frame, as on the board.

## What is real and what is a placeholder

This is a **prototype with canned responses**. Nothing calls an AI yet.

- Every string on the design board is used word for word.
- Anything the board does not show is a bracketed placeholder (`[Skeptic reply, turn 3]`, `[Coach outline]`, `[Coach sample reply]`, and the openings and reviews for the four questions other than "Why does God allow suffering?"). No apologetics content is invented. Replace the placeholders in `src/data/scripts.ts`.
- Sources are the board's hard-coded `Source title one, Author, year` placeholders.
- The wordmark is a placeholder (`data-logo-placeholder`) until the logo file exists. Pass `src` to `Logo` once it does.
- The round Coach chip uses a cross glyph as a stand-in for the logo.
- The daily limit is 3 new conversations per local day, kept in `localStorage` (`src/conversation/dailyLimit.ts`). It is checked only when a new conversation starts, never mid-conversation, and resets at local midnight. This is a client-side stand-in for a real server-side limit.
- Voice input uses the browser's speech recognition where it exists. Where it does not, the Speak button is disabled.
- "How limits work" on the limit screen opens the How it works sheet. The board does not define it.

## Adding real AI later

`src/conversation/provider.ts` is the seam. `App.tsx` uses `cannedProvider`. A live provider would call a small server route that holds the API key (a key must not ship in the browser bundle) and return the same four things: skeptic opening, skeptic reply, Coach content, review. Swapping it in is one line in `App.tsx`.

## Design fidelity

Compared against the board screen by screen in a headless browser: Home, Browse, Turn 3, Skeptic replying and Feedback are pixel-identical. The Coach sheet and How it works sheet are identical too; only the dimmed area behind their scrim differs, because the board's wireframe hides the "Simulated skeptic" badge there and the app shows the real screen. The limit screen differs only in the reset time (the board shows `[time]`, the app shows the real time). `src/styles/app.css` is the board's own stylesheet with hex values replaced by the equal design-system tokens (`src/styles/ds/`, copied unchanged from the Apologist Project Design System). The tokens come from the system. The components are local, because the board differs from the system's own components on purpose:

| Board | Design system component |
|---|---|
| Sentence-case button labels | Uppercase labels |
| Outlined secondary button | Filled gray secondary |
| 8px suggested-question chips, 40px tall | 6px, 44px tall |
| 20px card padding on the board | 32px |
| Skeptic replies in bubbles | Bubble-less agent turns |

Known departures from the design system's accessibility rules, kept because the board specifies them:

- Several buttons are 34px or 40px tall. The system asks for 44px minimum tap targets.
- Secondary text uses `--gray-300`, which passes contrast.

Dev-only: `npm run dev` then `/?screen=home|browse|turn3|coach|replying|limit|how|feedback` loads each state from the board. It is removed from production builds.

## Layout

```
src/styles/ds/        design-system tokens (unchanged)
src/styles/app.css    board styles on tokens, plus a few app-only rules at the end
src/components/       Button, TopBar, TurnProgress, ChatBubble, Composer, CoachFab, Sheet, Logo, Icon
src/screens/          Home, Browse, Conversation (ready / replying / limit), Feedback, CoachSheet, HowItWorksSheet
src/conversation/     state machine, provider interface, canned provider, daily limit, dev fixtures
src/data/             questions and canned scripts
```
