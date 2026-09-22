import { useEffect, useRef, useState } from 'react';
import type { Place } from './types';

export type SearchState = {
  results: Place[];
  status: 'idle' | 'loading' | 'ready' | 'error';
};

const MIN_QUERY_LENGTH = 2;

export function usePlaceSearch(query: string): SearchState {
  const [state, setState] = useState<SearchState>({ results: [], status: 'idle' });

  // Incremented on every request so a slow earlier response can be discarded.
  const latestRequest = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setState({ results: [], status: 'idle' });
      return;
    }

    const requestId = ++latestRequest.current;
    const controller = new AbortController();

    setState((previous) => ({ ...previous, status: 'loading' }));

    fetch(`/api/places?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
        return response.json() as Promise<{ results: Place[] }>;
      })
      .then((data) => {
        if (requestId !== latestRequest.current) return;
        setState({ results: data.results, status: 'ready' });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (requestId !== latestRequest.current) return;
        setState({ results: [], status: 'error' });
      });

    return () => controller.abort();
  }, [query]);

  return state;
}
