import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router';
import type { Question } from '../conversation/types';
import { topicLabel } from '../data/questions';
import { TopicTile } from './TopicTile';
import s from './QuestionCard.module.css';

interface Props {
  question: Question;
  practiced?: boolean;
}

/** One question in a list. The whole card is the link, so the tap target is generous. */
export function QuestionCard({ question, practiced }: Props) {
  return (
    <Link to={`/practice/${question.id}`} viewTransition className={s.card}>
      <TopicTile topic={question.topic} />
      <span className={s.body}>
        <span className={s.topic}>
          {topicLabel(question.topic)}
          {practiced && (
            <span className={s.done}>
              <CheckCircleIcon aria-hidden="true" />
              Practiced
            </span>
          )}
        </span>
        <span className={s.text}>{question.text}</span>
      </span>
    </Link>
  );
}
