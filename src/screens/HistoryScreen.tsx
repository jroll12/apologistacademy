import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../app/AppContext';
import { Button, ButtonLink } from '../components/Button';
import { StateCard } from '../components/Notice';
import { TopBar } from '../components/TopBar';
import { TopicTile } from '../components/TopicTile';
import { findQuestion, QUESTIONS } from '../data/questions';
import { cx } from '../lib/cx';
import { listConversations, practicedIds } from '../store/store';
import ui from '../styles/ui.module.css';
import s from './HistoryScreen.module.css';

const formatDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Past conversations and their reviews. Unfinished ones can be resumed. */
export function HistoryScreen() {
  const { data, clearHistory } = useApp();
  const conversations = listConversations(data).filter((c) => c.messages.length > 0 && findQuestion(c.questionId));
  const practiced = practicedIds(data);

  // Clearing takes two taps. The second must come within a few seconds.
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <div className={ui.screen}>
      <TopBar title="History" backTo="/" narrow />
      <main className={cx(ui.container, ui.page, ui.narrow)}>
        <p className={ui.muted}>
          {practiced.size} of {QUESTIONS.length} questions practiced. Saved on this device only.
        </p>

        {conversations.length === 0 ? (
          <StateCard
            icon={<ChatBubbleLeftRightIcon />}
            title="No conversations yet"
            actions={
              <ButtonLink variant="primary" block to="/questions">
                Browse questions
              </ButtonLink>
            }
          >
            <p className={ui.text}>When you practice a question, it shows up here with its review.</p>
          </StateCard>
        ) : (
          <>
            <ul className={s.list}>
              {conversations.map((c) => {
                const question = findQuestion(c.questionId)!;
                const ended = c.status === 'ended';
                return (
                  <li key={c.id}>
                    <Link to={ended ? `/review/${c.id}` : `/talk/${c.id}`} viewTransition className={s.item}>
                      <TopicTile topic={question.topic} />
                      <span className={s.body}>
                        <span className={s.question}>{question.text}</span>
                        <span className={ui.small}>
                          {formatDate(c.updatedAt)} · {ended ? 'Ended' : 'In progress'}
                        </span>
                      </span>
                      <span className={s.go} aria-hidden="true">
                        {ended ? 'Review' : 'Resume'}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className={s.clear}>
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirming) {
                    clearHistory();
                    setConfirming(false);
                  } else setConfirming(true);
                }}
              >
                {confirming ? 'Tap again to clear everything' : 'Clear history'}
              </Button>
              <span className="sr-only" role="status">
                {confirming ? 'Press the button again to delete all saved conversations.' : ''}
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
