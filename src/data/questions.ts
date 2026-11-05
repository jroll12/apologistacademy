import type { Question, Topic } from '../conversation/types';

export const QUESTIONS: Question[] = [
  { id: 'suffering', text: 'Why does God allow suffering?', topic: 'Suffering' },
  { id: 'bible', text: 'Can I trust the Bible?', topic: 'The Bible' },
  { id: 'resurrection', text: 'Did Jesus really rise?', topic: 'Jesus' },
  { id: 'science', text: "Doesn't science disprove God?", topic: 'Science' },
  { id: 'only-way', text: 'Is Jesus the only way?', topic: 'Jesus' },
];

export const SUGGESTED_ID = 'suffering';

export const TOPICS: Array<'All' | Topic> = ['All', 'Suffering', 'The Bible', 'Jesus', 'Science'];

export function getQuestion(id: string): Question {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown question: ${id}`);
  return q;
}

export function filterQuestions(topic: 'All' | Topic): Question[] {
  return topic === 'All' ? QUESTIONS : QUESTIONS.filter((q) => q.topic === topic);
}
