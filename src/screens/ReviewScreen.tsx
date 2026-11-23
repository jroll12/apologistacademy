import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { useApp } from '../app/AppContext';
import { Button, ButtonLink } from '../components/Button';
import { ChatBubble } from '../components/ChatBubble';
import { DraftNote } from '../components/Notice';
import { TopBar } from '../components/TopBar';
import { contextOf, describeError } from '../conversation/provider';
import { findQuestion } from '../data/questions';
import { isDraft } from '../data/scripts';
import { usePageTitle } from '../hooks/usePageTitle';
import { cx } from '../lib/cx';
import ui from '../styles/ui.module.css';
import { NotFoundScreen } from './NotFoundScreen';
import s from './ReviewScreen.module.css';

function Note({ label, children }: { label: string; children: string }) {
  return (
    <section className={cx(ui.card, s.note)}>
      <h3 className={cx(ui.h3, s.noteTitle)}>{label}</h3>
      <p className={cx(ui.text, s.noteText)}>{children}</p>
    </section>
  );
}

/** The conversation has ended. Coach's notes, a verse, sources, and the transcript. No scores. */
export function ReviewScreen() {
  const { conversationId = '' } = useParams();
  const { data, provider, mode, dispatch } = useApp();
  const conversation = data.conversations[conversationId];
  const question = findQuestion(conversation?.questionId);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  usePageTitle(question ? `Review: ${question.text}` : 'Review');

  const id = conversation?.id;
  const needsReview = !!conversation && conversation.status === 'ended' && !conversation.review;

  useEffect(() => {
    if (!conversation || !needsReview || mode === 'checking') return;
    let cancelled = false;
    const ctrl = new AbortController();
    setError(null);
    provider
      .review(contextOf(conversation), { signal: ctrl.signal })
      .then((review) => !cancelled && dispatch(conversation.id, { type: 'REVIEW_LOADED', review }))
      .catch((err: unknown) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, needsReview, mode, attempt, provider]);

  if (!conversation || !question) return <NotFoundScreen what="conversation" />;
  if (conversation.status !== 'ended') return <Navigate to={`/talk/${conversation.id}`} replace />;

  const { review, messages } = conversation;
  const closing = [...messages].reverse().find((m) => m.from === 'skeptic');

  return (
    <div className={ui.screen}>
      <TopBar backTo="/" />
      <main className={cx(ui.container, ui.page, s.review)}>
        <div className={s.lead}>
          <span className={ui.eyebrow}>Review</span>
          <h1 className={cx(ui.h1, s.question)} tabIndex={-1}>
            {question.text}
          </h1>
          {closing && <ChatBubble message={closing} still />}
        </div>

        <div className={s.main}>
          <h2 className={ui.h2}>Coach review</h2>

          {review ? (
            <div className={cx(s.notes, ui.rise)}>
              {review.covered && <Note label="What you covered">{review.covered}</Note>}
              <Note label="What you could add">{review.couldAdd}</Note>
              <Note label="One possible answer">{review.possibleAnswer}</Note>
              {!review.personalized && (
                <p className={ui.small}>
                  These are general notes for this question. With live AI, the review responds to what you said.
                </p>
              )}
              {!review.personalized && isDraft(question.id) && <DraftNote />}
            </div>
          ) : error ? (
            <div className={cx(ui.card, s.note)} role="alert">
              <p className={ui.text}>The review could not be loaded. {error}</p>
              <Button variant="secondary" size="sm" className={s.retry} onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </Button>
            </div>
          ) : (
            <div className={s.notes} role="status" aria-label="Coach is writing your review">
              <div className={ui.skeleton} />
              <div className={ui.skeleton} />
            </div>
          )}
        </div>

        <aside className={s.side} aria-label="Scripture and sources">
          <section className={cx(ui.card, s.note)}>
            <h3 className={cx(ui.h3, s.noteTitle)}>Scripture</h3>
            <blockquote className={s.verse}>
              <p className={ui.text}>{question.verse.text}</p>
              <cite className={s.cite}>
                {question.verse.ref} ({question.verse.translation})
              </cite>
            </blockquote>
          </section>

          {/* Hidden until the question has real sources. */}
          {question.sources.length > 0 && (
            <section className={cx(ui.card, s.note)}>
              <h3 className={cx(ui.h3, s.noteTitle)}>Sources</h3>
              <ul className={s.sources}>
                {question.sources.map((src) => (
                  <li key={src.href}>
                    <a className={ui.link} href={src.href} target="_blank" rel="noreferrer">
                      {src.title}
                    </a>
                    <span className={ui.small}> · {src.publisher}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <details className={s.transcript}>
          <summary className={s.summary}>Your conversation</summary>
          <div className={s.transcriptBody}>
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} still />
            ))}
          </div>
        </details>

        <div className={s.actions}>
          <ButtonLink variant="primary" block to="/questions">
            Practice another question
          </ButtonLink>
          <ButtonLink variant="secondary" block to={`/practice/${question.id}`}>
            Try this question again
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
