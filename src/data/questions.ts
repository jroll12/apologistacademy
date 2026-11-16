import type { Question, Topic, TopicId } from '../conversation/types';

export const TOPICS: Topic[] = [
  { id: 'suffering', label: 'Suffering' },
  { id: 'bible', label: 'The Bible' },
  { id: 'jesus', label: 'Jesus' },
  { id: 'science', label: 'Science' },
  { id: 'god', label: 'God' },
  { id: 'morality', label: 'Right and wrong' },
  { id: 'faiths', label: 'Other faiths' },
  { id: 'church', label: 'The church' },
];

/**
 * Scripture is quoted from the Berean Standard Bible and was checked word for word against the
 * source text. The house translation is ESV; swap the wording here if the team prefers it.
 *
 * `sources` is empty on purpose. Sources are never invented: the team adds real titles and links,
 * and until then the review says "Sources to be added".
 */
export const QUESTIONS: Question[] = [
  {
    id: 'suffering',
    text: 'Why does God allow suffering?',
    topic: 'suffering',
    verse: {
      ref: 'Psalm 34:18',
      text: 'The LORD is near to the brokenhearted; He saves the contrite in spirit.',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'unanswered-prayer',
    text: "Why didn't God answer my prayer?",
    topic: 'suffering',
    verse: {
      ref: '2 Corinthians 12:9',
      text: 'But He said to me, “My grace is sufficient for you, for My power is perfected in weakness.”',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'bible',
    text: 'Can I trust the Bible?',
    topic: 'bible',
    verse: {
      ref: '2 Peter 1:16',
      text: 'For we did not follow cleverly devised fables when we made known to you the power and coming of our Lord Jesus Christ, but we were eyewitnesses of His majesty.',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'contradictions',
    text: "Isn't the Bible full of contradictions?",
    topic: 'bible',
    verse: {
      ref: 'Proverbs 18:17',
      text: 'The first to state his case seems right until another comes and cross-examines him.',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'resurrection',
    text: 'Did Jesus really rise?',
    topic: 'jesus',
    verse: {
      ref: '1 Corinthians 15:14',
      text: 'And if Christ has not been raised, our preaching is worthless, and so is your faith.',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'only-way',
    text: 'Is Jesus the only way?',
    topic: 'jesus',
    verse: {
      ref: 'John 14:6',
      text: 'Jesus answered, “I am the way and the truth and the life. No one comes to the Father except through Me.”',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'science',
    text: "Doesn't science disprove God?",
    topic: 'science',
    verse: {
      ref: 'Psalm 19:1',
      text: 'The heavens declare the glory of God; the skies proclaim the work of His hands.',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'evolution',
    text: "Doesn't evolution rule out a creator?",
    topic: 'science',
    verse: { ref: 'Genesis 1:1', text: 'In the beginning God created the heavens and the earth.', translation: 'BSB' },
    sources: [],
  },
  {
    id: 'existence',
    text: 'How do you know God exists?',
    topic: 'god',
    verse: {
      ref: 'Romans 1:20',
      text: 'For since the creation of the world God’s invisible qualities, His eternal power and divine nature, have been clearly seen, being understood from His workmanship, so that men are without excuse.',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'who-made-god',
    text: 'If God made everything, who made God?',
    topic: 'god',
    verse: {
      ref: 'Psalm 90:2',
      text: 'Before the mountains were born or You brought forth the earth and the world, from everlasting to everlasting You are God.',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'good-without-god',
    text: "Can't I be good without God?",
    topic: 'morality',
    verse: {
      ref: 'Romans 2:15',
      text: 'So they show that the work of the law is written on their hearts, their consciences also bearing witness, and their thoughts either accusing or defending them',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'hell',
    text: 'Why would a loving God send anyone to hell?',
    topic: 'morality',
    verse: {
      ref: '2 Peter 3:9',
      text: 'The Lord is not slow in keeping His promise as some understand slowness, but is patient with you, not wanting anyone to perish but everyone to come to repentance.',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'all-religions',
    text: "Don't all religions teach the same thing?",
    topic: 'faiths',
    verse: {
      ref: 'Acts 17:27',
      text: 'God intended that they would seek Him and perhaps reach out for Him and find Him, though He is not far from each one of us.',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'raised',
    text: "Isn't faith just how you were raised?",
    topic: 'faiths',
    verse: { ref: '1 Thessalonians 5:21', text: 'but test all things. Hold fast to what is good.', translation: 'BSB' },
    sources: [],
  },
  {
    id: 'hypocrites',
    text: 'Why are Christians such hypocrites?',
    topic: 'church',
    verse: {
      ref: 'Mark 2:17',
      text: 'On hearing this, Jesus told them, “It is not the healthy who need a doctor, but the sick. I have not come to call the righteous, but sinners.”',
      translation: 'BSB',
    },
    sources: [],
  },
  {
    id: 'wars',
    text: "Hasn't religion caused most wars?",
    topic: 'church',
    verse: {
      ref: 'Matthew 5:9',
      text: 'Blessed are the peacemakers, for they will be called sons of God.',
      translation: 'BSB',
    },
    sources: [],
  },
];

export const SUGGESTED_ID = 'suffering';

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export function findQuestion(id: string | undefined | null): Question | undefined {
  return id ? byId.get(id) : undefined;
}

export function topicLabel(id: TopicId): string {
  return TOPICS.find((t) => t.id === id)?.label ?? id;
}

/** Topic filter plus a plain text search over the question and its topic name. */
export function searchQuestions(topic: TopicId | 'all', query: string): Question[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return QUESTIONS.filter((q) => {
    if (topic !== 'all' && q.topic !== topic) return false;
    const haystack = `${q.text} ${topicLabel(q.topic)}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

/** A random question, never the one in `exclude` (so "Surprise me" is a surprise). */
export function randomQuestion(exclude: string[] = [], random: () => number = Math.random): Question {
  const pool = QUESTIONS.filter((q) => !exclude.includes(q.id));
  const from = pool.length ? pool : QUESTIONS;
  return from[Math.floor(random() * from.length)];
}
