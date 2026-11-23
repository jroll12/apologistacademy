import { describe, expect, it } from 'vitest';
import { TAGLINE } from './copy';
import { DIFFICULTIES, PERSONAS } from './personas';
import { QUESTIONS, randomQuestion, searchQuestions, TOPICS } from './questions';
import { CLOSING, SCRIPTS } from './scripts';

/** Every piece of text the app can show from the content files. */
function allCopy(): Array<[where: string, text: string]> {
  const out: Array<[string, string]> = [['closing', CLOSING]];
  for (const q of QUESTIONS) out.push([`${q.id}.question`, q.text]);
  for (const [id, s] of Object.entries(SCRIPTS)) {
    out.push([`${id}.opening`, s.opening]);
    s.replies.forEach((r, i) => out.push([`${id}.reply${i + 1}`, r]));
    out.push([`${id}.nudge`, s.coach.nudge], [`${id}.outline`, s.coach.outline], [`${id}.sample`, s.coach.sample]);
    out.push([`${id}.couldAdd`, s.review.couldAdd], [`${id}.possibleAnswer`, s.review.possibleAnswer]);
  }
  out.push(['tagline', TAGLINE]);
  for (const p of PERSONAS) out.push([`persona.${p.id}`, `${p.label} ${p.blurb}`]);
  for (const d of DIFFICULTIES) out.push([`difficulty.${d.id}`, `${d.label} ${d.blurb}`]);
  return out;
}

describe('content', () => {
  it('has a script for every question, and no script without a question', () => {
    expect(Object.keys(SCRIPTS).sort()).toEqual(QUESTIONS.map((q) => q.id).sort());
  });

  it('gives every script an opening, four replies, Coach help and review notes', () => {
    for (const [id, s] of Object.entries(SCRIPTS)) {
      const parts = [
        s.opening,
        ...s.replies,
        s.coach.nudge,
        s.coach.outline,
        s.coach.sample,
        s.review.couldAdd,
        s.review.possibleAnswer,
      ];
      expect(s.replies, id).toHaveLength(4);
      for (const part of parts) expect(part.trim().length, id).toBeGreaterThan(0);
    }
  });

  it('leaves no bracketed placeholders', () => {
    for (const [where, text] of allCopy()) expect(text, where).not.toMatch(/\[[^\]]+\]/);
  });

  it('uses unique question ids and known topics', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    const topics = new Set(TOPICS.map((t) => t.id));
    for (const q of QUESTIONS) expect(topics.has(q.topic), q.id).toBe(true);
    for (const t of TOPICS)
      expect(
        QUESTIONS.some((q) => q.topic === t.id),
        t.id,
      ).toBe(true);
  });

  it('gives every question a verse with a reference', () => {
    for (const q of QUESTIONS) {
      expect(q.verse.text.length, q.id).toBeGreaterThan(10);
      expect(q.verse.ref, q.id).toMatch(/\d+:\d+/);
    }
  });

  it('invents no sources: any listed source has a title, publisher and https link', () => {
    for (const q of QUESTIONS) {
      for (const s of q.sources) {
        expect(s.title.length && s.publisher.length, q.id).toBeTruthy();
        expect(s.href, q.id).toMatch(/^https:\/\//);
      }
    }
  });

  describe('voice rules from the design system', () => {
    it('has no em dashes', () => {
      for (const [where, text] of allCopy()) expect(text, where).not.toMatch(/[—–]/);
    });

    it('has no emoji', () => {
      for (const [where, text] of allCopy()) expect(text, where).not.toMatch(/\p{Extended_Pictographic}/u);
    });

    it('avoids the banned filler words', () => {
      const banned = /\b(delve|unlock|leverage|game-changer|revolutionize|seamlessly)\b/i;
      for (const [where, text] of allCopy()) expect(text, where).not.toMatch(banned);
    });

    it('never has the skeptic claim to be converted', () => {
      const converted =
        /\b(i now believe|i believe (now|in (god|jesus|christ))|you('ve| have) convinced me|i('m| am) convinced|i accept (jesus|christ))\b/i;
      for (const [id, s] of Object.entries(SCRIPTS)) {
        for (const line of [s.opening, ...s.replies, CLOSING]) expect(line, id).not.toMatch(converted);
      }
    });
  });
});

describe('search', () => {
  it('returns everything with no filter', () => {
    expect(searchQuestions('all', '')).toHaveLength(QUESTIONS.length);
  });

  it('filters by topic', () => {
    expect(searchQuestions('jesus', '').map((q) => q.id)).toEqual(['resurrection', 'only-way']);
  });

  it('matches words in any order, ignoring case', () => {
    expect(searchQuestions('all', 'BIBLE trust').map((q) => q.id)).toEqual(['bible']);
  });

  it('matches the topic name too', () => {
    expect(searchQuestions('all', 'church').map((q) => q.id)).toEqual(['hypocrites', 'wars']);
  });

  it('combines topic and text', () => {
    expect(searchQuestions('science', 'evolution').map((q) => q.id)).toEqual(['evolution']);
    expect(searchQuestions('science', 'prayer')).toEqual([]);
  });
});

describe('surprise me', () => {
  it('never returns an excluded question', () => {
    for (let i = 0; i < 200; i++) expect(randomQuestion(['suffering']).id).not.toBe('suffering');
  });

  it('still returns something if everything is excluded', () => {
    expect(randomQuestion(QUESTIONS.map((q) => q.id))).toBeDefined();
  });

  it('can reach the first and last of the pool', () => {
    expect(randomQuestion(['suffering'], () => 0).id).toBe(QUESTIONS[1].id);
    expect(randomQuestion(['suffering'], () => 0.999).id).toBe(QUESTIONS.at(-1)!.id);
  });
});
