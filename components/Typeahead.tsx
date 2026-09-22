'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { usePlaceSearch } from '@/lib/usePlaceSearch';
import type { Place } from '@/lib/types';

const DEBOUNCE_MS = 300;

function describe(place: Place): string {
  return [place.name, place.admin, place.country].filter(Boolean).join(', ');
}

export function Typeahead() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Place | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const { results, status } = usePlaceSearch(debouncedQuery);

  // The user has typed something new that we haven't searched for yet.
  const isTyping = query.trim() !== debouncedQuery.trim();
  const isLoading = status === 'loading' || (isTyping && query.trim().length >= 2);
  const showList = isOpen && query.trim().length >= 2;

  function choose(place: Place) {
    setSelected(place);
    setQuery(describe(place));
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!results.length) return;

      setIsOpen(true);
      setActiveIndex((current) => {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const next = current + step;
        if (next < 0) return results.length - 1;
        if (next > results.length - 1) return 0;
        return next;
      });
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      choose(results[activeIndex]);
    }
  }

  return (
    <div className="typeahead">
      <label htmlFor="place-search">Search for a city</label>

      <input
        id="place-search"
        ref={inputRef}
        type="text"
        value={query}
        autoComplete="off"
        placeholder="Search for a city, e.g. Lagos"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelected(null);
          setActiveIndex(-1);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
      />

      {showList && (
        <div className="panel">
          {isLoading && <p className="message">Searching…</p>}

          {!isLoading && status === 'error' && (
            <p className="message error" role="alert">
              Something went wrong. Please try again.
            </p>
          )}

          {!isLoading && status === 'ready' && results.length === 0 && (
            <p className="message">No places match that search.</p>
          )}

          {!isLoading && results.length > 0 && (
            <ul id={listboxId} role="listbox" aria-label="Search results">
              {results.map((place, index) => (
                <li
                  key={place.id}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={index === activeIndex ? 'option active' : 'option'}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(place)}
                >
                  <span className="name">{place.name}</span>
                  <span className="meta">{[place.admin, place.country].filter(Boolean).join(', ')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p aria-live="polite" className="status">
        {selected
          ? `Selected ${describe(selected)} (${selected.latitude.toFixed(2)}, ${selected.longitude.toFixed(2)})`
          : ''}
      </p>
    </div>
  );
}
