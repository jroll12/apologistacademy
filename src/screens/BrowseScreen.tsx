import { Button } from '../components/Button';
import { TopBar } from '../components/TopBar';
import { TOPICS, filterQuestions } from '../data/questions';
import type { Topic } from '../conversation/types';

interface Props {
  filter: 'All' | Topic;
  onFilter: (f: 'All' | Topic) => void;
  onStart: (questionId: string) => void;
  onBack: () => void;
  onHow: () => void;
}

export function BrowseScreen({ filter, onFilter, onStart, onBack, onHow }: Props) {
  return (
    <>
      <TopBar title="All questions" onBack={onBack} onHow={onHow} />
      <main className="body" style={{ gap: 14 }}>
        <div className="chips" role="group" aria-label="Filter by topic">
          {TOPICS.map((t) => (
            <button key={t} type="button" className={t === filter ? 'chip on' : 'chip'} aria-pressed={t === filter} onClick={() => onFilter(t)}>
              {t}
            </button>
          ))}
        </div>
        {filterQuestions(filter).map((q) => (
          <div key={q.id} className="card row sb" style={{ padding: '12px 16px', gap: 12 }}>
            <div>
              <span className="muted" style={{ fontSize: 13 }}>{q.topic}</span>
              <p className="d" style={{ fontSize: 16, lineHeight: 1.3, margin: '2px 0 0' }}>{q.text}</p>
            </div>
            <Button variant="ghost" size="sm" aria-label={`Start: ${q.text}`} onClick={() => onStart(q.id)}>Start</Button>
          </div>
        ))}
      </main>
    </>
  );
}
