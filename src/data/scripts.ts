import type { CoachContent, Review } from '../conversation/types';

/**
 * Draft copy. Strings that appear in the design board are used word for word.
 * Anything the design does not show is a bracketed placeholder, so no apologetics
 * content is invented here. Replace with real content or a live provider.
 */

export interface Script {
  opening: string;
  /** Skeptic reply after the user's reply 1..4. */
  replies: [string, string, string, string];
  coach: CoachContent;
  review: Review;
}

export const CLOSING = 'I need to think about that. Thanks for the talk.';

const SOURCES = [
  { title: 'Source title one, Author, year', href: '#' },
  { title: 'Source title two, Author, year', href: '#' },
];

const replyPlaceholders = (): Script['replies'] => [
  '[Skeptic reply, turn 2]',
  '[Skeptic reply, turn 3]',
  '[Skeptic reply, turn 4]',
  '[Skeptic reply, turn 5]',
];

const placeholderScript = (question: string): Script => ({
  opening: `[Skeptic opening for: ${question}]`,
  replies: replyPlaceholders(),
  coach: { nudge: '[Coach nudge]', outline: '[Coach outline]', sample: '[Coach sample reply]' },
  review: {
    covered: '[What you covered]',
    couldAdd: '[What you could add]',
    possibleAnswer: '[One possible answer]',
    sources: SOURCES,
  },
});

export const SCRIPTS: Record<string, Script> = {
  suffering: {
    opening: 'If God is good and strong, why is there so much pain?',
    replies: ['That does not explain a child who gets sick.', ...replyPlaceholders().slice(1)] as Script['replies'],
    coach: {
      nudge: 'Name what the skeptic is really asking: why this pain, not just any pain.',
      outline: '[Coach outline]',
      sample: '[Coach sample reply]',
    },
    review: {
      covered: 'Free will. A caring tone when it got personal.',
      couldAdd: 'Ask what is behind the question.',
      possibleAnswer: 'Pain is real. A good God can allow it for reasons we only partly see.',
      sources: SOURCES,
    },
  },
  bible: placeholderScript('Can I trust the Bible?'),
  resurrection: placeholderScript('Did Jesus really rise?'),
  science: placeholderScript("Doesn't science disprove God?"),
  'only-way': placeholderScript('Is Jesus the only way?'),
};
