import { useEffect, useMemo, useReducer } from 'react';
import { cannedProvider } from './conversation/cannedProvider';
import { canStart, defaultStorage, formatReset, recordStart } from './conversation/dailyLimit';
import { fixtureFromUrl } from './conversation/fixtures';
import type { ConversationProvider } from './conversation/provider';
import { initialState, reducer } from './conversation/state';
import { getQuestion } from './data/questions';
import { BrowseScreen } from './screens/BrowseScreen';
import { CoachSheet } from './screens/CoachSheet';
import { ConversationScreen } from './screens/ConversationScreen';
import { FeedbackScreen } from './screens/FeedbackScreen';
import { HomeScreen } from './screens/HomeScreen';
import { HowItWorksSheet } from './screens/HowItWorksSheet';

/** Swap this for a live provider (server route holding the API key) when AI is wired in. */
const live: ConversationProvider = cannedProvider;
/** Fixture screens hold still so they can be compared with the design board. */
const frozen: ConversationProvider = { ...cannedProvider, opening: () => new Promise(() => {}), reply: () => new Promise(() => {}) };

export default function App() {
  const fixture = useMemo(() => (import.meta.env.DEV ? fixtureFromUrl() : null), []);
  const provider = fixture ? frozen : live;
  const [state, dispatch] = useReducer(reducer, fixture ?? initialState);
  const storage = useMemo(defaultStorage, []);

  // Skeptic opening and replies.
  useEffect(() => {
    if (state.view !== 'conversation' || !state.pending || !state.questionId) return;
    let live = true;
    const q = getQuestion(state.questionId);
    const convoId = state.convoId;
    const next = state.userReplies === 0 ? provider.opening(q) : provider.reply(q, state.messages, state.userReplies);
    next.then((text) => live && dispatch({ type: 'SKEPTIC', convoId, text }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.view, state.pending, state.convoId, state.userReplies]);

  // Coach content, loaded when the sheet first opens.
  useEffect(() => {
    if (state.sheet !== 'coach' || state.coach || !state.questionId) return;
    const convoId = state.convoId;
    provider.coach(getQuestion(state.questionId), state.messages).then((coach) => dispatch({ type: 'COACH_LOADED', convoId, coach }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sheet, state.coach, state.convoId]);

  // Review, loaded when the conversation ends.
  useEffect(() => {
    if (state.view !== 'feedback' || state.review || !state.questionId) return;
    const convoId = state.convoId;
    provider.review(getQuestion(state.questionId), state.messages).then((review) => dispatch({ type: 'REVIEW_LOADED', convoId, review }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.view, state.review, state.convoId]);

  // The daily limit is checked only when a NEW conversation starts, never mid-conversation.
  const start = (questionId: string) => {
    const now = new Date();
    const limited = !canStart(storage, now);
    if (!limited) recordStart(storage, now);
    dispatch({ type: 'START', questionId, limited });
  };

  const openHow = () => dispatch({ type: 'SHEET', sheet: 'how' });
  const closeSheet = () => dispatch({ type: 'SHEET', sheet: null });
  const back = () => dispatch({ type: 'BACK' });

  return (
    <div className="app stage">
      <div className="ph">
        {state.view === 'home' && <HomeScreen onStart={start} onBrowse={() => dispatch({ type: 'GO', view: 'browse' })} onHow={openHow} />}
        {state.view === 'browse' && (
          <BrowseScreen filter={state.filter} onFilter={(filter) => dispatch({ type: 'FILTER', filter })} onStart={start} onBack={back} onHow={openHow} />
        )}
        {state.view === 'conversation' && (
          <ConversationScreen
            state={state}
            resetTime={formatReset(new Date())}
            onSend={(text) => dispatch({ type: 'SEND', text })}
            onCoach={() => dispatch({ type: 'SHEET', sheet: 'coach' })}
            onBack={back}
            onHow={openHow}
            onBrowse={() => dispatch({ type: 'GO', view: 'browse' })}
          />
        )}
        {state.view === 'feedback' && (
          <FeedbackScreen
            state={state}
            onBack={back}
            onHow={openHow}
            onAnother={() => dispatch({ type: 'GO', view: 'browse' })}
            onRetry={() => state.questionId && start(state.questionId)}
          />
        )}
        {state.sheet === 'coach' && (
          <CoachSheet step={state.coachStep} coach={state.coach} onNext={() => dispatch({ type: 'COACH_STEP' })} onClose={closeSheet} />
        )}
        {state.sheet === 'how' && <HowItWorksSheet onClose={closeSheet} />}
      </div>
    </div>
  );
}
