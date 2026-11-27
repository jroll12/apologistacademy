# Claims register: Apologist Academy film

Every statement the film makes, sorted by how we know it. "Verified" means checked against the source named here, today.

## Verified in the product's code (this repository)

| Said or shown in the film | Where it is true |
|---|---|
| Sixteen questions across eight topics | `src/data/questions.ts`: 8 entries in `TOPICS`, 16 questions |
| Five turns | `src/conversation/types.ts`: `TOTAL_TURNS = 5` |
| Curious "asks honest questions and wants to understand"; Hostile "openly against it, pushes hard, stays civil"; Balanced "fair-minded, weighs both sides" | `src/data/personas.ts` (the blurbs, word for word) |
| You set how hard it pushes; Tough "presses on weak spots" | `src/data/personas.ts`: Gentle, Standard, Tough |
| Coach helps in steps: hint, outline, sample reply | the app's Coach sheet ("Step 1 of 3: hint"), filmed in the footage |
| The review: what you covered, what you could add, a verse; no scores | `src/conversation/types.ts` (`Review`), the review screen in the footage |
| Print or save as PDF | the review screen in the footage |
| The AI is always labeled | "AI skeptic" label and the AI button, in the footage |
| Never claims to be converted; never insults | `server/prompts.ts`: "Never claim that anyone was converted", "Never insult, mock or demean the practicer or their faith" |
| In a crisis it stops and points to real help | `server/prompts.ts`: "stop the exercise, answer with care... encourage them to reach out to someone they trust or to local emergency services" |
| One checked verse, no made-up sources | `server/prompts.ts`: one passage quoted word for word from the question's stored verse; "Do not name books, authors, websites or studies, and do not give statistics" |
| Our server sets the rules; separate instructions for each role | `server/prompts.ts` (skeptic, Coach and review prompts), `server/handler.ts` |
| A daily limit on live use | `server/deps.ts`: `LIVE_GLOBAL_LIMIT`, default 500 |
| Memory off | `server/chatCompletionsClient.ts`: `max_memories: 0` |
| Saved only on your device | conversations are kept in the browser's `localStorage` (`ap.practice.v1`) |
| No account, nothing to install | the site has no sign-in; it is a web page |

## Verified at the source

- **1 Peter 3:15, Berean Standard Bible:** "Always be prepared to give a defense to everyone who asks you the reason for the hope that is in you. But respond with gentleness and respect." Checked with the Study Bible lookup earlier in this project (the same wording as slide 5).

## Real output, recorded

- **Every AI reply on screen** (the skeptic's six lines, Coach's hint, outline and sample reply, and the review) is the live site's own output from one run on Nov 27, 2026 at 04:32 UTC, copied from the API responses (`capture/live-capture.json`). The film replays that text through the real app (`tools/mockapi.mjs`) so it could be filmed at 3× resolution; the timing of the typing and streaming is staged, the words are not.
- **The replies typed by "you"** are the five demo replies from `docs/hackathon/script-long.md`, written by Jarret for the demo.

## Quoted on screen, word for word (polish pass)

**Rule text from `server/prompts.ts`** (the Safeguards code card; line numbers as of commit f125973; "…" marks text left out):

| Line | Shown |
|---|---|
| 18 | "… Never claim that anyone was converted." |
| 46 | "- Stay respectful. Never insult, mock or demean the practicer or their faith. No profanity or slurs." |
| 49 | "- If you are asked whether you are an AI or a real person, say plainly that you are a simulated skeptic in a practice tool, then carry on." |
| 51 | "- If the practicer seems to be in real personal crisis or mentions harming themselves, stop the exercise, answer with care in your own plain voice, and encourage them to reach out to someone they trust or to local emergency services." |
| 70 | "Scripture: you may quote exactly one passage, word for word … Do not quote any other Scripture. …" |
| 71 | "Do not name books, authors, websites or studies, and do not give statistics." |

**AI text enlarged beside the phone**, all from `capture/live-capture.json` (the same live run), each labeled as a real reply or an excerpt:
- Skeptic, opening: "If God is all powerful and loving, I don't see why a child gets cancer or a tsunami wipes out a village." (from `skeptic[0]`)
- "It answers what you actually said": your reply 1, "…real love needs real choices." (`me[0]`), and the skeptic's answer, "But what about suffering where nobody is choosing anything … How does free will explain that?" (`skeptic[1]`, with a middle clause left out)
- Coach's hint, in full (`coach.nudge`), and the first sentence of the sample reply (`coach.sample`)
- The personal beat: "A little, yes. Someone close to me went through a long illness, and I never knew what to make of it." (`skeptic[2]`)
- The data-flow diagram's two bubbles: "If it is personal, I'm sorry…" (`me[2]`) and the reply it got, "I appreciate you not pretending…" (`skeptic[3]`)
- "This run: Balanced, Standard" marks the settings the recorded run actually used (`persona`, `difficulty`).

## Synthesized (our story and wording, not facts)

- The coworker, "Sam", the text "Honest question. If God is good, why does my sister have cancer?" are an illustration.
- The drafts typed and deleted ("Well, everything happens for a reason", "God has a plan, and") and the bookend reply ("I'm so sorry. I don't have a neat answer, and I won't pretend to. How is she doing?").
- On-screen summaries: "Not for lack of belief. For lack of practice.", "Find your own words first.", "Not a debate to win. A person to listen to.", "It doesn't replace your church."
- The narration is ElevenLabs "Jason" (voice `ILP9IN5fT2Jr2fSfmoNh`), reading `script.json`. The music is generated by ElevenLabs Music.

## Theological claim check

- The narration asserts no doctrine. It quotes 1 Peter 3:15 with its reference and says the tool "doesn't replace your church".
- Doctrinal statements appear only inside the app footage: the practicer's replies (written for the demo) and the AI's replies (live output). The film labels the AI text as AI output from the live site. Under The Apologist Project's house rules, theology goes to Jake for approval before a public post; a hackathon submission is Jarret's call.
