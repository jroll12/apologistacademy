# Persona test plan

**Goal.** Before outside testing, check that the site is usable, useful, accessible, findable, desirable and valuable for each kind of person likely to use or judge it, and turn what we find into a final change list.

**Build tested.** `main` at `24cf519`, run locally. Two modes:

- **Scripted** (no AI key): what anyone gets if live AI is off.
- **Live path with a fake model** (`MOCK_AI=1`): exercises every live screen and state, but the replies are canned.

**Limits of this test (stated up front).**

- The live site can't be reached from this environment, and the real model is never called here. Anything about the quality, tone or safety of real AI replies is checked only by reading the prompts, not by running them. A short manual script for that is at the end.
- Only Chromium is installed. Firefox and Safari behaviour is emulated (for example, removing the speech API) or reasoned from the code, and marked as such.
- No real people. Each persona is a lens a tester applies on purpose; findings are the tester's observations against measurable checks, not user research.

## The six qualities, as checks

| Quality    | What "pass" means here                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Usable     | The person reaches their goal without dead ends, guessing, or reading instructions. Count taps and screens to first skeptic message.      |
| Useful     | The thing they came for exists: practice, help when stuck, something to take away.                                                        |
| Accessible | WCAG 2.2 AA: axe clean, keyboard-only, screen reader names and order, 200% text and 320px reflow, reduced motion, 44px targets, contrast. |
| Findable   | Inside: questions and features can be found. Outside: title, description, share preview, icon, deep links work.                           |
| Desirable  | It looks considered and consistent, and the tone fits a church audience without feeling cringe or preachy.                                |
| Valuable   | The person would come back or recommend it, and it supports the mission (equipping believers).                                            |

## Personas

| #   | Persona                                                                                         | Device and context                            | Main lens                                           |
| --- | ----------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| P1  | **Maria**, 34, small-group member. A coworker asked her why God allows suffering and she froze. | iPhone, first visit, link from a church email | Usable, useful                                      |
| P2  | **Pastor James**, 52, youth pastor deciding whether to use it with his group                    | Desktop then phone; reads everything          | Valuable, theology, shareable                       |
| P3  | **Ethan**, 16, in James's youth group. Short attention, allergic to "churchy".                  | Android Chrome, 360px, may use voice          | Desirable, usable                                   |
| P4  | **Ruth**, 71, retired teacher, low vision                                                       | Tablet, text set to 200%, zoomed              | Accessible (reflow, text size)                      |
| P5  | **Dev**, 29, blind, screen reader and keyboard only                                             | Desktop                                       | Accessible (keyboard, semantics)                    |
| P6  | **Ana**, 40, Brazilian, English is her second language                                          | Phone on a slow connection, Firefox           | Usable (plain language), performance, no speech API |
| P7  | **Hackathon judge**, 45, arrives from aiforchurch.com with 3 minutes                            | Desktop 1440px                                | Findable, desirable, valuable at a glance           |
| P8  | **Priya**, 31, UX/UI designer                                                                   | Desktop and phone, every state                | Consistency, hierarchy, states, design system fit   |
| P9  | **Sam**, 27, curious non-Christian who wants to see "the other side", and pokes at it           | Desktop                                       | Safety, honesty about AI, guardrails                |
| P10 | **Grace**, 38, lost her mother last spring                                                      | Phone                                         | Emotional safety on the suffering question          |
| P11 | **Maria, day 3** (returning user)                                                               | iPhone                                        | History, resume, daily limit                        |

## User stories and the test for each

| ID           | Story                                                                                             | Test (input → expected output)                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 (P1, P3)  | As a first-time visitor, I want to start practicing within a minute without reading instructions. | Fresh visit at 390 and 360px → first skeptic message in ≤3 taps after the intro, no scrolling needed to find Start.                                             |
| S2 (P1)      | When I'm stuck I want help that gets me to my own words.                                          | Open Coach mid-turn → nudge, then outline, then sample, each one tap; can close and keep typing.                                                                |
| S3 (P1, P11) | I want to leave and come back to my conversation.                                                 | Reply, reload, leave to Home → Resume card, draft kept, same turn.                                                                                              |
| S4 (P2)      | I want to judge in two minutes whether this is sound and safe for teens.                          | Read Home, How it works, a question page, a review, the prompts → AI disclosure visible, no scores, scripture cited, sources honest.                            |
| S5 (P2)      | I want to send one question to my group.                                                          | Copy `/practice/suffering` link → it opens directly on that question, has a sensible tab title and share preview.                                               |
| S6 (P3)      | I want to speak instead of type.                                                                  | Mic button present where supported, absent with a clear message where not.                                                                                      |
| S7 (P4)      | I need to read it at large text sizes.                                                            | Text at 200% (browser font setting) and 320px width → everything readable, nothing clipped or overlapping, no sideways scroll.                                  |
| S8 (P5)      | I need to do everything by keyboard with a screen reader.                                         | Tab through every screen; check names, roles, focus order, focus visible, announcements for new messages and Coach.                                             |
| S9 (P6)      | I want plain English and a page that loads on a slow phone.                                       | Reading level of UI copy; load on slow 3G; offline mid-conversation behaviour.                                                                                  |
| S10 (P7)     | In 30 seconds I want to know what it is and why it's good.                                        | Above-the-fold content at 1440px; time to a finished review; visual polish.                                                                                     |
| S11 (P8)     | I want consistent components, clear hierarchy and every state designed.                           | Screenshot every screen and state at 1440, 1024, 390; audit type scale, spacing, buttons, empty, loading, error, limit states.                                  |
| S12 (P9)     | I want to know it's an AI, and I want to see whether it can be pushed off the rails.              | AI labelling on every conversation screen; read server guardrails; send off-topic and hostile input through the fake-model path to check limits and validation. |
| S13 (P10)    | I don't want to be lectured while I'm hurting.                                                    | Read the suffering script, Coach sample, review copy for tone.                                                                                                  |
| S14 (P11)    | I want to see what I've practiced and know my limits.                                             | History list, review from history, daily limit message and reset time, clear history.                                                                           |

## Method

One scripted browser run per persona, plus code and copy inspection. Each run saves screenshots and measurements. Results, with evidence, go in `2-findings.md`. The change plan goes in `3-change-plan.md` and is for approval, not applied.

## Manual check that can't be done here

On the live site with live AI: one conversation per skeptic style (Curious, Hostile, Balanced) on the suffering question; ask the skeptic "are you a real person?"; try to change the subject; check the review mentions what you actually said.
