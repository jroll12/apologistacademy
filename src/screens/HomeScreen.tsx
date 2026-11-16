import { Link, useNavigate } from 'react-router';
import { useApp } from '../app/AppContext';
import { Button, ButtonLink } from '../components/Button';
import { Blob } from '../components/Notice';
import { TopBar } from '../components/TopBar';
import { turnOf } from '../conversation/conversation';
import { TOTAL_TURNS } from '../conversation/types';
import { findQuestion, QUESTIONS, randomQuestion, SUGGESTED_ID, topicLabel } from '../data/questions';
import { cx } from '../lib/cx';
import { practicedIds, resumable } from '../store/store';
import ui from '../styles/ui.module.css';
import s from './HomeScreen.module.css';

export function HomeScreen() {
  const { data } = useApp();
  const navigate = useNavigate();

  const practiced = practicedIds(data);
  const resume = resumable(data);
  const resumeQuestion = findQuestion(resume?.questionId);

  // Suggest the first question not practiced yet, so the suggestion moves on as the person does.
  const suggested = QUESTIONS.find((q) => !practiced.has(q.id)) ?? findQuestion(SUGGESTED_ID)!;
  const others = QUESTIONS.filter((q) => q.id !== suggested.id)
    .sort((a, b) => Number(practiced.has(a.id)) - Number(practiced.has(b.id)))
    .slice(0, 6);

  const surprise = () => navigate(`/practice/${randomQuestion([suggested.id]).id}`, { viewTransition: true });

  return (
    <div className={ui.screen}>
      <Blob />
      <TopBar />
      <main className={cx(ui.container, ui.page, s.home)}>
        <div className={cx(s.lead, ui.rise)}>
          <div className={s.hero}>
            <span className={ui.eyebrow}>Practice conversations</span>
            <h1 className={cx(ui.display, s.headline)} tabIndex={-1}>
              Practice a hard talk
            </h1>
            <p className={cx(ui.text, s.sub)}>
              Five turns with a simulated skeptic. Coach help when you want it. No scores.
            </p>
          </div>

          {resume && resumeQuestion && (
            <section className={cx(ui.card, s.feature)} aria-labelledby="resume-title">
              <span className={ui.eyebrow} id="resume-title">
                Pick up where you left off
              </span>
              <p className={cx(ui.display, s.featureQuestion)}>{resumeQuestion.text}</p>
              <p className={ui.small}>
                Turn {turnOf(resume)} of {TOTAL_TURNS}
              </p>
              <ButtonLink variant="primary" block to={`/talk/${resume.id}`} className={s.featureAction}>
                Resume
              </ButtonLink>
            </section>
          )}

          <section className={cx(ui.card, s.feature)} aria-labelledby="suggested-title">
            <span className={ui.eyebrow} id="suggested-title">
              Suggested to start
            </span>
            <p className={cx(ui.display, s.featureQuestion)}>{suggested.text}</p>
            {/* One primary button per screen: Resume takes it when there is something to resume. */}
            <ButtonLink
              variant={resume ? 'secondary' : 'primary'}
              block
              to={`/practice/${suggested.id}`}
              className={s.featureAction}
            >
              Start
            </ButtonLink>
          </section>

          <div className={s.actions}>
            <Button variant="secondary" onClick={surprise}>
              Surprise me
            </Button>
            <ButtonLink variant="secondary" to="/questions">
              Browse all
            </ButtonLink>
          </div>
        </div>

        <div className={cx(s.more, ui.rise)}>
          <section aria-labelledby="pick-one">
            <h2 id="pick-one" className={ui.h3}>
              Or pick one
            </h2>
            <ul className={s.picks}>
              {others.map((q) => (
                <li key={q.id} className={s.pick}>
                  <Link to={`/practice/${q.id}`} viewTransition className={s.pickLink}>
                    <span>{q.text}</span>
                    <span className={s.pickTopic}>{topicLabel(q.topic)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={s.progress} aria-label="Your progress">
            <div className={cx(ui.row, ui.between)}>
              <label htmlFor="practiced" className={ui.small}>
                {practiced.size} of {QUESTIONS.length} practiced
              </label>
              <Link to="/history" viewTransition className={cx(ui.link, s.historyLink)}>
                History
              </Link>
            </div>
            <progress id="practiced" className={s.bar} max={QUESTIONS.length} value={practiced.size} />
          </section>

          <p className={ui.small}>Simulated skeptic. Practice only. No scores.</p>
        </div>
      </main>
    </div>
  );
}
