import { Button } from '../components/Button';
import { TopBar } from '../components/TopBar';
import { QUESTIONS, SUGGESTED_ID, getQuestion } from '../data/questions';

interface Props {
  onStart: (questionId: string) => void;
  onBrowse: () => void;
  onHow: () => void;
}

export function HomeScreen({ onStart, onBrowse, onHow }: Props) {
  const suggested = getQuestion(SUGGESTED_ID);
  const others = QUESTIONS.filter((q) => q.id !== SUGGESTED_ID);
  const surprise = () => onStart(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)].id);

  return (
    <>
      <TopBar onHow={onHow} />
      <main className="body">
        <div className="col" style={{ gap: 8 }}>
          <span className="eb">Practice conversations</span>
          <h1 className="d" style={{ fontSize: 34, lineHeight: 1.05, letterSpacing: '-0.02em' }}>Practice a hard talk</h1>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <span className="eb">Suggested to start</span>
          <p className="d" style={{ fontSize: 22, lineHeight: 1.2, marginTop: 8 }}>{suggested.text}</p>
          <Button variant="pri" block style={{ marginTop: 18 }} onClick={() => onStart(suggested.id)}>Start</Button>
        </div>
        <div className="row">
          <Button variant="sec" style={{ flex: 1 }} onClick={surprise}>Surprise me</Button>
          <Button variant="sec" style={{ flex: 1 }} onClick={onBrowse}>Browse all</Button>
        </div>
        <section aria-labelledby="pick-one">
          <h2 id="pick-one" className="d" style={{ fontSize: 16, marginBottom: 2 }}>Or pick one</h2>
          {others.map((q) => (
            <button key={q.id} type="button" className="rowq" onClick={() => onStart(q.id)}>
              <span>{q.text}</span>
              <span className="muted" style={{ fontSize: 13 }}>{q.topic}</span>
            </button>
          ))}
        </section>
        <span className="badge" style={{ marginTop: 'auto' }}>Simulated skeptic. Practice only. No scores.</span>
      </main>
    </>
  );
}
