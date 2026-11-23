import { ClockIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../app/AppContext';
import { Button, ButtonLink } from '../components/Button';
import { Blob, DraftNote, StateCard } from '../components/Notice';
import { TopBar } from '../components/TopBar';
import { TopicTile } from '../components/TopicTile';
import { canStart, formatReset } from '../conversation/dailyLimit';
import type { Difficulty, PersonaId } from '../conversation/types';
import { usePageTitle } from '../hooks/usePageTitle';
import { DEFAULT_DIFFICULTY, DEFAULT_PERSONA, DIFFICULTIES, PERSONAS } from '../data/personas';
import { findQuestion, topicLabel } from '../data/questions';
import { isDraft } from '../data/scripts';
import { cx } from '../lib/cx';
import ui from '../styles/ui.module.css';
import { NotFoundScreen } from './NotFoundScreen';
import s from './PreBriefScreen.module.css';

/** The step before a conversation: the question, the skeptic's style, and Start. */
export function PreBriefScreen() {
  const { questionId } = useParams();
  const { storage, mode, startConversation, openHow } = useApp();
  const navigate = useNavigate();
  const question = findQuestion(questionId);

  const [persona, setPersona] = useState<PersonaId>(DEFAULT_PERSONA);
  const [difficulty, setDifficulty] = useState<Difficulty>(DEFAULT_DIFFICULTY);
  const [starting, setStarting] = useState(false);
  // The question is this page's heading, so the top bar has no title. Name the tab after it.
  usePageTitle(question?.text);

  if (!question) return <NotFoundScreen what="question" />;

  const now = new Date();
  const limited = !canStart(storage, now);
  const live = mode === 'live';

  const start = async () => {
    setStarting(true);
    const id = await startConversation(question.id, persona, difficulty);
    navigate(`/talk/${id}`, { viewTransition: true });
  };

  return (
    <div className={ui.screen}>
      <Blob />
      <TopBar backTo="/questions" narrow />
      <main className={cx(ui.container, ui.page, ui.narrow, ui.rise, s.page)}>
        <div className={s.question}>
          <TopicTile topic={question.topic} size="lg" />
          <div>
            <span className={ui.eyebrow}>{topicLabel(question.topic)}</span>
            <h1 className={cx(ui.h1, s.questionText)} tabIndex={-1}>
              {question.text}
            </h1>
          </div>
        </div>

        {limited ? (
          <StateCard
            icon={<ClockIcon />}
            title="Daily limit reached"
            actions={
              <>
                <ButtonLink variant="primary" block to="/questions">
                  Back to questions
                </ButtonLink>
                <Button variant="ghost" block onClick={openHow}>
                  How limits work
                </Button>
              </>
            }
          >
            <p className={ui.text}>You have used today's practice conversations. Come back tomorrow for more.</p>
            <p className={ui.muted}>Resets at {formatReset(now)}.</p>
          </StateCard>
        ) : (
          <>
            <fieldset className={s.group} disabled={!live}>
              <legend className={ui.h3}>Skeptic style</legend>
              {!live && (
                <p className={ui.small}>
                  Styles need live AI. This version uses one scripted skeptic for each question.
                </p>
              )}
              <div className={s.options}>
                {PERSONAS.map((p) => (
                  <label key={p.id} className={s.option}>
                    <input
                      type="radio"
                      name="persona"
                      className="sr-only"
                      value={p.id}
                      checked={persona === p.id}
                      onChange={() => setPersona(p.id)}
                    />
                    <span className={s.optionLabel}>{p.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={s.group} disabled={!live}>
              <legend className={ui.h3}>Difficulty</legend>
              <div className={cx(s.options, s.three)}>
                {DIFFICULTIES.map((d) => (
                  <label key={d.id} className={s.option}>
                    <input
                      type="radio"
                      name="difficulty"
                      className="sr-only"
                      value={d.id}
                      checked={difficulty === d.id}
                      onChange={() => setDifficulty(d.id)}
                    />
                    <span className={s.optionLabel}>{d.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {!live && isDraft(question.id) && <DraftNote />}

            <div className={s.start}>
              <Button variant="primary" block onClick={start} disabled={starting}>
                {starting ? 'Starting' : 'Start'}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
