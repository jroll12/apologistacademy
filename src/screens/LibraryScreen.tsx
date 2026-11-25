import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useApp } from '../app/AppContext';
import { Button } from '../components/Button';
import { StateCard } from '../components/Notice';
import { QuestionCard } from '../components/QuestionCard';
import { TopBar } from '../components/TopBar';
import type { TopicId } from '../conversation/types';
import { searchQuestions, TOPICS } from '../data/questions';
import { useChipPeek } from '../hooks/useChipPeek';
import { NARROW, useMediaQuery } from '../hooks/useMediaQuery';
import { cx } from '../lib/cx';
import { practicedIds } from '../store/store';
import ui from '../styles/ui.module.css';
import s from './LibraryScreen.module.css';

const isTopic = (value: string | null): value is TopicId => TOPICS.some((t) => t.id === value);

/** Every question, with search and topic filters. The filters live in the URL, so Back restores them. */
export function LibraryScreen() {
  const { data } = useApp();
  const [params, setParams] = useSearchParams();

  const query = params.get('q') ?? '';
  const topicParam = params.get('topic');
  const topic: TopicId | 'all' = isTopic(topicParam) ? topicParam : 'all';

  const update = (next: { q?: string; topic?: TopicId | 'all' }) => {
    const q = next.q ?? query;
    const t = next.topic ?? topic;
    const out = new URLSearchParams();
    if (q) out.set('q', q);
    if (t !== 'all') out.set('topic', t);
    setParams(out, { replace: true });
  };

  const chips = useRef<HTMLDivElement>(null);
  useChipPeek(chips, useMediaQuery(NARROW));

  const results = searchQuestions(topic, query);
  const practiced = practicedIds(data);
  const filtered = query !== '' || topic !== 'all';

  return (
    <div className={ui.screen}>
      <TopBar title="All questions" backTo="/" />
      <main className={cx(ui.container, ui.page, s.library)}>
        <div className={s.search}>
          <label htmlFor="question-search" className="sr-only">
            Search questions
          </label>
          <MagnifyingGlassIcon className={s.searchIcon} aria-hidden="true" />
          <input
            id="question-search"
            type="search"
            className={s.searchInput}
            placeholder="Search questions"
            value={query}
            onChange={(e) => update({ q: e.target.value })}
            autoComplete="off"
          />
        </div>

        <div ref={chips} className={s.chips} role="group" aria-label="Filter by topic">
          {[{ id: 'all' as const, label: 'All' }, ...TOPICS].map((t) => (
            <button
              key={t.id}
              type="button"
              className={cx(s.chip, t.id === topic && s.chipOn)}
              aria-pressed={t.id === topic}
              onClick={() => update({ topic: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="sr-only" role="status">
          {results.length} {results.length === 1 ? 'question' : 'questions'} shown
        </p>

        {results.length > 0 ? (
          <ul className={s.list}>
            {results.map((q) => (
              <li key={q.id}>
                <QuestionCard question={q} practiced={practiced.has(q.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <StateCard
            icon={<MagnifyingGlassIcon />}
            title="No questions match"
            actions={
              filtered && (
                <Button variant="secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  Clear search
                </Button>
              )
            }
          >
            <p className={ui.text}>Try a different word, or another topic.</p>
          </StateCard>
        )}
      </main>
    </div>
  );
}
