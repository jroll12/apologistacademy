# Persona test findings

Build: `main` at `24cf519`, tested locally on 2026-11-23 in Chromium. Scripted mode and the live path with a fake model. Plan: `1-test-plan.md`.

**How to read this.** Each finding says how I know it:

- **Measured**: a browser run produced the number or screenshot.
- **Code**: read directly in the source.
- **Judgement**: my assessment as that persona. Reasonable people could disagree.

Priority: **P0** fix before outside testing, **P1** should fix, **P2** polish.

## What passed (measured)

| Check                                      | Result                                                                                                                                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First visit to first skeptic message (S1)  | 3 taps after the intro, about 4.5s. Start is visible without scrolling at 390px.                                                                                                                           |
| Coach steps (S2)                           | Nudge, outline, sample, one tap each; closes back to the reply.                                                                                                                                            |
| Resume and drafts (S3)                     | A half-written reply survives a reload; Home shows Resume.                                                                                                                                                 |
| Voice (S6)                                 | Mic shown where speech is supported. Without it (Firefox emulated), the mic is hidden and a plain message says to type.                                                                                    |
| 600-character cap                          | Counter appears near the end ("10 left"); input stops at 600.                                                                                                                                              |
| Reflow (S7)                                | No sideways scrolling at 320px on Home, Questions, question page, History, or the conversation.                                                                                                            |
| Keyboard (S8)                              | Every screen reachable. Focus moves to each page's heading, returns to the reply box after the skeptic answers (rechecked; my first reading was taken too early), and new messages are announced politely. |
| Automated accessibility (axe, WCAG 2.2 AA) | Clean on the states the test suite didn't already cover: empty search, not found, phone menu open, live question page. The suite covers the rest.                                                          |
| Load time, production build (S9)           | Heading visible in 3.3s on slow 3G, 1.0s on fast 3G, 0.3s on 4G. JavaScript is 106 KB compressed.                                                                                                          |
| Offline (S9)                               | Scripted mode keeps working offline. Live mode shows "Could not reach the server" and an offline note, and **Try again** recovers once back online.                                                        |
| Page titles and deep links (S5)            | Every page has its own tab title, such as "Why does God allow suffering? · Apologist Academy". Links straight to a question open it.                                                                       |
| Server input checks (S12)                  | Over-long replies, unknown questions, unknown styles and too many turns are all rejected with a 400.                                                                                                       |
| Guardrails (S12, S13), code                | The skeptic must stay respectful, say it's simulated if asked, and stop and point to help if someone seems to be in crisis. Coach and review may quote only the one checked verse.                         |
| No scores (S4)                             | None anywhere.                                                                                                                                                                                             |

## Findings

### P0: fix before outside testing

**F1. Testers have no way to give feedback.** Code. There's no feedback link, form or email anywhere. Real testing depends on it. _All personas, valuable._ Needs from you: where feedback should go (a form link or an email address).

**F2. Live testers will be blocked after 3 conversations a day.** Code and measured. The browser enforces 3 a day in every mode (`dailyLimit.ts`, checked on the question page), and How it works says "3" even in live mode. The server's live limit is 10, so the server's setting never matters. A tester exploring three styles on two questions hits the wall halfway. _P2 Pastor James, P7 judge, P11._

**F3. Shared links look broken.** Code and measured. No favicon (`/favicon.ico` returns 404), no home-screen icon, and no share-preview tags, so a link pasted into a text, email or Slack shows no title card or image. This matters most for the hackathon page and James sending the link to his group. _Findable._

**F4. "Sources to be added." shows on every review.** Measured. To a tester or judge it reads as unfinished. _P2, P7, P8, desirable._

### P1: should fix

**F5. No word on privacy.** Code. Nothing says that what you type is sent to an AI service, or that conversations are saved only in this browser. Grace might type something personal. Facts I checked: replies go to the server and on to the AI; conversations stay in browser storage; the server keeps only an anonymous daily counter. _P10 Grace, P2, valuable and trust._

**F6. Nothing says who made it.** Code. No mention of The Apologist Project in the interface (only in the AI instructions). A pastor deciding whether to trust it looks for this first. _Judgement. P2, P7._ Needs from you: the link to use, if any.

**F7. The browser's text-size setting has no effect.** Measured. With the default text size at 200%, body text stayed 18px and the heading stayed 46px, because every size is set in pixels. Page zoom still works and reflow passes, so this isn't a WCAG failure, but many older readers use the text-size setting, not zoom. _P4 Ruth, accessible._

**F8. The first-visit intro covers the landing page.** Measured. A judge's first view is a modal over the page. It also has two ways out ("Close" and "Got it"). _Judgement:_ the "AI skeptic" tag and the How it works link already cover what it says on the way in. _P7, P3, desirable._

**F9. Skeptic style buttons leave a gap on desktop.** Measured. Three styles sit in a four-column grid, so there's an empty slot to the right, while Difficulty below fills its row. _P8, desirable._

### P2: polish

**F10. Fifteen different font sizes, and eight colours hard-coded outside the design tokens.** Code. Mostly small differences (12, 13, 14, 15, 16, 17px). Fixing F7 is the natural time to collapse these onto the design system's scale. _P8._

**F11. The "AI skeptic" tag also shows in scripted mode, where the skeptic is a script.** Code. It only matters if live AI is off, which is rare on the live site. _P9 Sam, honesty._

**F12. History says "0 of 16 questions practiced" next to three conversations in progress.** Measured. Reads as discouraging. "3 in progress" would be fairer. _P11._

**F13. Tight at 200% zoom on a laptop.** Measured. At 640×400 CSS pixels the conversation area is 196px tall, because the header and turn bar stay put. Usable, but cramped. _P4._

**F14. On desktop, the header comes last in the keyboard order and there's no skip link.** Measured. Focus starts at the page heading, so content comes first, which is fine for most. The eight topic chips add eight Tab stops before the questions. _P5, minor._

**F15. "Nudge" may not be clear to non-native speakers.** Judgement. "Hint" is plainer. _P6 Ana._

## Not tested here (needs the live site)

Real AI replies: tone of each style (especially Hostile), whether the skeptic admits it's AI when asked, whether it stays on topic, the crisis behaviour, and whether the review reflects what was said. The manual script is in `1-test-plan.md`.

## Persona summary

| Persona              | Usable | Useful | Accessible  | Findable | Desirable | Valuable              |
| -------------------- | ------ | ------ | ----------- | -------- | --------- | --------------------- |
| P1 Maria             | Pass   | Pass   | Pass        | Pass     | Pass      | F1                    |
| P2 Pastor James      | Pass   | F4     | Pass        | F3       | Pass      | F5, F6                |
| P3 Ethan             | Pass   | Pass   | Pass        | Pass     | F8        | Pass                  |
| P4 Ruth              | F13    | Pass   | F7          | Pass     | Pass      | Pass                  |
| P5 Dev               | Pass   | Pass   | F14 (minor) | Pass     | n/a       | Pass                  |
| P6 Ana               | F15    | Pass   | Pass        | Pass     | Pass      | Pass                  |
| P7 Judge             | F8     | F4     | Pass        | F3       | F4, F9    | F6                    |
| P8 Priya (designer)  | Pass   | n/a    | Pass        | Pass     | F9, F10   | n/a                   |
| P9 Sam               | Pass   | Pass   | Pass        | Pass     | Pass      | F11; live AI untested |
| P10 Grace            | Pass   | Pass   | Pass        | Pass     | Pass      | F5; live AI untested  |
| P11 Maria, returning | F2     | Pass   | Pass        | Pass     | F12       | F2                    |
