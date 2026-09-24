'use client';
import React from 'react';
import { Button, Icon, Page, PageHeader, Section, Skeleton } from '@/components/sixteen';
import LeitnerStrip from './vocabulary/LeitnerStrip';
import WordBrowser from './vocabulary/WordBrowser';
import StudySession from './vocabulary/StudySession';
import SessionSummary from './vocabulary/SessionSummary';

// Vocabulary — flashcard (know / flip) + “which passage uses the word correctly?”
// Bank: AODEFEN SAT 500. Progress in Supabase (Leitner boxes).

function LoadingState() {
  return (
    <>
      <Section title="Progress">
        <Skeleton height={10} radius={999} />
        <Skeleton width="70%" height={12} style={{ marginTop: 14 }} />
      </Section>
      <Section title="Words">
        <Skeleton width={360} height={32} radius={8} style={{ maxWidth: '100%', marginBottom: 14 }} />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} height={44} radius={8} style={{ marginBottom: 6 }} />
        ))}
      </Section>
    </>
  );
}

/** Reviews due now — summary.due also counts never-seen words, so subtract those. */
function reviewsDue(summary) {
  return Math.max(0, (summary?.due ?? 0) - (summary?.new ?? 0));
}

function headerSubtitle(summary, knownCount, bankSize) {
  if (!summary) return 'SAT words, a few at a time.';
  if (!summary.seen) return `${bankSize} SAT words to learn, a few at a time.`;
  return `${knownCount} of ${bankSize} learned · ${reviewsDue(summary)} due today`;
}

function startLabel(summary) {
  if (!summary?.seen) return 'Start learning';
  return reviewsDue(summary) > 0 ? 'Study due words' : 'Learn new words';
}

function Vocabulary() {
  const [hub, setHub] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [phase, setPhase] = React.useState('hub'); // hub | practice | done
  const [items, setItems] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [sessionLoading, setSessionLoading] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [hubTick, setHubTick] = React.useState(0);
  const [query, setQuery] = React.useState('');

  const loadHub = React.useCallback(() => { setHubTick((t) => t + 1); }, []);

  React.useEffect(() => {
    let on = true;
    fetch('/api/vocab')
      .then((r) => r.json())
      .then((j) => {
        if (!on) return;
        if (!j?.success) throw new Error(j?.error || 'Failed to load');
        setHub(j.data);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (!on) return;
        setError(e.message || 'Failed to load');
        setLoading(false);
      });
    return () => { on = false; };
  }, [hubTick]);

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    loadHub();
  };

  const startPractice = async () => {
    setSessionLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ count: '12' });
      const r = await fetch(`/api/vocab/session?${q}`);
      const j = await r.json();
      if (!j?.success) throw new Error(j?.error || 'Could not start');
      const list = j.data.items || [];
      if (!list.length) throw new Error('No words available.');
      setItems(list);
      setIdx(0);
      setResults([]);
      setPhase('practice');
    } catch (e) {
      setError(e.message || 'Could not start');
    } finally {
      setSessionLoading(false);
    }
  };

  const onItemDone = (payload) => {
    setResults((prev) => [...prev, { correct: payload.correct, word: payload.word }]);
    if (idx + 1 >= items.length) {
      setPhase('done');
      loadHub();
    } else {
      setIdx((i) => i + 1);
    }
  };

  const backToHub = () => { setPhase('hub'); loadHub(); };

  const summary = hub?.summary;
  const words = hub?.words;
  const knownCount = React.useMemo(() => (words || []).filter((w) => w.known).length, [words]);
  const bankSize = summary?.total ?? hub?.bankSize ?? 0;

  if (phase === 'practice' && items[idx]) {
    return (
      <Page width="narrow">
        <StudySession
          key={items[idx].wordId + idx}
          item={items[idx]}
          index={idx}
          total={items.length}
          onDone={onItemDone}
          onExit={backToHub}
        />
      </Page>
    );
  }

  if (phase === 'done') {
    return (
      <Page width="narrow">
        <SessionSummary
          results={results}
          onAgain={() => startPractice()}
          onBack={backToHub}
          starting={sessionLoading}
          error={error}
        />
      </Page>
    );
  }

  const loadFailed = !hub && !loading && error;

  return (
    <Page>
      <PageHeader
        title="Vocabulary"
        subtitle={headerSubtitle(summary, knownCount, bankSize)}
        actions={hub && (
          <Button
            variant="primary"
            icon={<Icon name="play" size={13} />}
            loading={sessionLoading}
            onClick={() => startPractice()}
          >
            {startLabel(summary)}
          </Button>
        )}
      />

      {loadFailed && (
        <p style={{ margin: 0, font: 'var(--role-body)', color: 'var(--error)' }} role="alert">
          Couldn’t load your words ({error}).{' '}
          <Button variant="ghost" size="sm" onClick={retryLoad}>Try again</Button>
        </p>
      )}

      {hub && error && (
        <p style={{ margin: '0 0 20px', font: 'var(--role-body)', color: 'var(--error)' }} role="alert">
          {error}
        </p>
      )}

      {loading && !hub && <LoadingState />}

      {hub && (
        <>
          <Section
            title="Progress"
            description="Each correct answer moves a word up a box. Know it without flipping to mark it learned."
          >
            <LeitnerStrip words={words || []} />
          </Section>
          <Section title="Words">
            <WordBrowser
              words={words || []}
              filter={filter}
              onFilter={setFilter}
              query={query}
              onQuery={setQuery}
            />
          </Section>
        </>
      )}
    </Page>
  );
}

export default Vocabulary;
