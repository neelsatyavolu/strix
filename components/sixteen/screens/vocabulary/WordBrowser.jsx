'use client';
import React from 'react';
import { Badge, EmptyState, Icon, Input, List, ListRow, Tabs } from '@/components/sixteen';
import { FILTERS, STATUS_BADGE, applyFilter, applySearch, wordStatus } from './words';
import s from './WordBrowser.module.css';

const EMPTY_COPY = {
  all: 'The word bank is empty.',
  todo: 'You know every word in the list.',
  known: 'Words you know without flipping — and then use correctly — land here.',
  due: 'Nothing is due right now. Come back later for your next review.',
  learning: 'Words you have started but not yet learned show up here.',
};

/** Browse mode: filter pills + search + the word list with a status badge per word. */
export default function WordBrowser({ words, filter, onFilter, query, onQuery }) {
  const tabs = React.useMemo(() => {
    const now = new Date();
    return FILTERS.map((f) => ({ ...f, count: applyFilter(words, f.value, now).length }));
  }, [words]);

  const visible = React.useMemo(
    () => applySearch(applyFilter(words, filter), query),
    [words, filter, query],
  );

  const now = new Date();
  const searching = query.trim().length > 0;

  return (
    <div className={s.browser}>
      <div className={s.toolbar}>
        <Tabs variant="pill" tabs={tabs} value={filter} onChange={onFilter} className={s.tabs} />
        <Input
          type="search"
          variant="sunken"
          fullWidth={false}
          className={s.search}
          icon={<Icon name="search" size={13} />}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search words or definitions"
          aria-label="Search words"
        />
      </div>

      {visible.length === 0 ? (
        <List>
          <EmptyState
            compact
            icon={searching ? 'search' : 'book-a'}
            title={searching ? `No matches for “${query.trim()}”` : 'No words here yet'}
            body={searching ? 'Try another word or clear the search.' : EMPTY_COPY[filter]}
          />
        </List>
      ) : (
        <List>
          {visible.map((w) => {
            const badge = STATUS_BADGE[wordStatus(w, now)];
            return (
              <ListRow
                key={w.id}
                title={w.word}
                subtitle={<span className={s.def}>{w.definition}</span>}
                trailing={<Badge size="sm" variant={badge.variant}>{badge.label}</Badge>}
              />
            );
          })}
        </List>
      )}
    </div>
  );
}
