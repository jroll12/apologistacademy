import { ArrowPathRoundedSquareIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useApp } from '../app/AppContext';
import { Button, ButtonLink } from '../components/Button';
import { Blob } from '../components/Notice';
import { QuestionCard } from '../components/QuestionCard';
import { TopBar } from '../components/TopBar';
import { TAGLINE } from '../data/copy';
import { findQuestion, QUESTIONS, randomQuestion, TOPICS } from '../data/questions';
import { useChipPeek } from '../hooks/useChipPeek';
import { NARROW, useMediaQuery } from '../hooks/useMediaQuery';
import { cx } from '../lib/cx';
import { practicedIds, resumable, suggestedQuestionId } from '../store/store';
import ui from '../styles/ui.module.css';
import s from './HomeScreen.module.css';

export function HomeScreen() {
  const { data } = useApp();
  const navigate = useNavigate();

  const practiced = practicedIds(data);
  const resume = resumable(data);
  const resumeQuestion = findQuestion(resume?.questionId);

  // Each visitor gets their own suggestion (picked at random on the first visit); it moves on once practiced.
  // Never the question already offered for Resume.
  const suggested = findQuestion(
    suggestedQuestionId(
      data,
      QUESTIONS.map((q) => q.id),
      resumeQuestion?.id,
    ),
  )!;
  const others = QUESTIONS.filter((q) => q.id !== suggested.id && q.id !== resumeQuestion?.id)
    .sort((a, b) => Number(practiced.has(a.id)) - Number(practiced.has(b.id)))
    .slice(0, 6);

  const topics = useRef<HTMLDivElement>(null);
  useChipPeek(topics, useMediaQuery(NARROW));

  const surprise = () => navigate(`/practice/${randomQuestion([suggested.id]).id}`, { viewTransition: true });

  return (
    <div className={ui.screen}>
      <Blob />
      <TopBar />
      <main className={cx(ui.container, ui.page, s.home, ui.rise)}>
        <div className={s.hero}>
          <h1 className={cx(ui.h1, s.headline)} tabIndex={-1}>
            Practice a hard talk
          </h1>
          <p className={s.tagline}>{TAGLINE}</p>
        </div>

        <div className={s.featured}>
          {resume && resumeQuestion && (
            <section className={s.feature} aria-labelledby="resume-title">
              <h2 className={ui.h3} id="resume-title">
                Pick up where you left off
              </h2>
              <div className={cx(ui.card, s.featureCard)}>
                <p className={cx(ui.display, s.featureQuestion)}>{resumeQuestion.text}</p>
                <ButtonLink variant="primary" to={`/talk/${resume.id}`} className={s.featureAction}>
                  Resume
                </ButtonLink>
              </div>
            </section>
          )}

          <section className={s.feature} aria-labelledby="suggested-title">
            <h2 className={ui.h3} id="suggested-title">
              Suggested to start
            </h2>
            <div className={cx(ui.card, s.featureCard)}>
              <p className={cx(ui.display, s.featureQuestion)}>{suggested.text}</p>
              {/* One primary button per screen: Resume takes it when there is something to resume. */}
              <ButtonLink
                variant={resume ? 'secondary' : 'primary'}
                to={`/practice/${suggested.id}`}
                className={s.featureAction}
              >
                Start
              </ButtonLink>
            </div>
          </section>
        </div>

        <section className={s.more} aria-labelledby="more-title">
          <div className={s.moreHead}>
            <h2 className={ui.h2} id="more-title">
              More questions
            </h2>
            <div className={s.moreActions}>
              <Button variant="ghost" size="sm" onClick={surprise}>
                <ArrowPathRoundedSquareIcon aria-hidden="true" />
                Surprise me
              </Button>
              <ButtonLink variant="ghost" size="sm" to="/questions">
                Browse all
                <ArrowRightIcon aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>

          <div ref={topics} className={s.topics} role="group" aria-label="Browse by topic">
            {TOPICS.map((t) => (
              <Link key={t.id} to={`/questions?topic=${t.id}`} viewTransition className={s.topic}>
                {t.label}
              </Link>
            ))}
          </div>

          <ul className={s.picks}>
            {others.map((q) => (
              <li key={q.id} className={s.pick}>
                <QuestionCard question={q} practiced={practiced.has(q.id)} />
              </li>
            ))}
          </ul>
        </section>

        {practiced.size > 0 && (
          <section className={s.progress} aria-label="Your progress">
            <label htmlFor="practiced" className={ui.small}>
              {practiced.size} of {QUESTIONS.length} practiced
            </label>
            <progress id="practiced" className={s.bar} max={QUESTIONS.length} value={practiced.size} />
          </section>
        )}
      </main>
    </div>
  );
}
