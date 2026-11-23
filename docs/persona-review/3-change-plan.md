# Change plan from the persona review

Status: applied on 2026-11-23, except F1 (no feedback link, by decision). See the re-test table at the end of `2-findings.md`.

## Decisions needed from you

1. **Feedback destination (F1):** a form link (Google Form, Typeform) or an email address.
2. **Live daily limit (F2):** I suggest 10 a day per person during testing, set on the server (`LIVE_DAILY_LIMIT`) with the browser following it.
3. **Credit link (F6):** the URL for "The Apologist Project", or plain text with no link.
4. **First-visit intro (F8):** open it the first time someone presses Start on a question, not on the landing page. Or remove the automatic opening entirely.

## Batch 1: before outside testing (P0)

| Item | Change                                                                                                                                                                                                                          | Files                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| F1   | "Send feedback" in the header nav (desktop) and the phone menu, plus a line at the end of every review: "How was this? Send feedback." Opens your destination in a new tab.                                                     | `TopBar.tsx`, `ReviewScreen.tsx`, new `src/data/links.ts`                                        |
| F2   | `/api/status` also returns the live per-person limit. In live mode the browser uses that number instead of 3, and How it works shows it. Scripted mode keeps 3.                                                                 | `server/handler.ts`, `liveProvider.ts`, `AppContext.tsx`, `dailyLimit.ts`, `HowItWorksSheet.tsx` |
| F3   | Favicon and home-screen icon from your cross SVG. Share-preview tags (title, description, image). A 1200×630 preview image: the cross, "Apologist Academy" and the tagline on the dark background, made from the design tokens. | `index.html`, `public/`                                                                          |
| F4   | Hide the Sources card when a question has no sources. It reappears automatically once sources are added.                                                                                                                        | `ReviewScreen.tsx`                                                                               |

## Batch 2: should fix (P1)

| Item     | Change                                                                                                                                                                                                                                      | Files                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| F5       | Add to "About the AI" in How it works: "What you type is sent to the AI to write replies, so leave out names and private details. Your conversations are saved only in this browser."                                                       | `HowItWorksSheet.tsx`                                         |
| F6       | "Made by The Apologist Project" at the bottom of How it works, and a small line at the foot of Home.                                                                                                                                        | `HowItWorksSheet.tsx`, `HomeScreen.tsx`                       |
| F7 + F10 | Move every font size to `rem`, mapped onto one scale of about seven steps from the design system, so the browser's text-size setting works. Replace the eight hard-coded colours with tokens. Screenshot baselines catch any visual change. | all `*.module.css`, `ui.module.css`                           |
| F8       | Per your decision 4. Also drop the intro's "Close" button so "Got it" is the one way out (Escape and tapping outside still work).                                                                                                           | `AppContext.tsx`, `PreBriefScreen.tsx`, `HowItWorksSheet.tsx` |
| F9       | Skeptic styles use a three-column grid on desktop.                                                                                                                                                                                          | `PreBriefScreen.module.css`                                   |

## Batch 3: polish (P2)

| Item | Change                                                               |
| ---- | -------------------------------------------------------------------- |
| F11  | Tag reads "Scripted skeptic" when live AI is off.                    |
| F12  | History summary: "3 in progress · 0 of 16 finished".                 |
| F13  | On short screens (under 500px tall), the turn bar and header shrink. |
| F14  | Add a "Skip to content" link, visible on focus.                      |
| F15  | Rename the Coach step "Nudge" to "Hint".                             |

## Verification

- `npm run check` and the full browser suite after each batch, plus new tests: feedback link present on review and in the menu; the live daily limit follows the server; the Sources card hidden when empty; the text-size setting at 200% enlarges body text.
- Rerun this persona script and update the findings table.
- Screenshots of changed screens at 1440, 1024 and 390px sent to you before merging.
- Then the manual live-AI check from `1-test-plan.md` on the live site.
