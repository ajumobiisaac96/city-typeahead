# City typeahead

A debounced, accessible autocomplete search built with Next.js (App Router), React and TypeScript.
Typing a city name queries the [Open-Meteo geocoding API](https://open-meteo.com/en/docs/geocoding-api)
through a small server route and returns matching places with their coordinates.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Jest + React Testing Library
```

No API key is needed.

## What it handles

- **Debounced input** — a request fires 300ms after typing stops, not on every keystroke.
- **Minimum query length** — searches start at two characters.
- **Loading, empty and error states** — each shown in the dropdown, with errors announced via `role="alert"`.
- **Keyboard navigation** — arrow keys move through results (wrapping at both ends), Enter selects, Escape closes.
- **Stale responses** — every request gets an id and an `AbortController`. A slow earlier response is
  cancelled where possible and discarded if it still arrives, so results always match the current query.
- **Accessibility** — the input is an ARIA combobox with a linked listbox, `aria-activedescendant`
  tracking the highlighted option, and a live region announcing the selection.
- **Caching** — the `/api/places` route caches upstream responses for an hour, so repeated searches
  for the same city are served without hitting the third-party API.

## Layout

```
app/
  api/places/route.ts   server route that proxies and caches the geocoding API
  page.tsx              demo page
components/
  Typeahead.tsx         the combobox: input, dropdown, keyboard handling
lib/
  useDebouncedValue.ts  generic debounce hook
  usePlaceSearch.ts     fetching, request cancellation, stale-response guard
__tests__/
  Typeahead.test.tsx    six tests covering the behaviour above
```

## Notes

The API is proxied rather than called from the browser so that caching, rate limiting and any future
key stay on the server, and so the client only deals with one response shape.
