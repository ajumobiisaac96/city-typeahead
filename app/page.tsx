import { Typeahead } from '@/components/Typeahead';

export default function Home() {
  return (
    <main>
      <h1>City search</h1>
      <p className="intro">
        Type at least two characters. Use the arrow keys to move through results, Enter to select,
        Escape to close.
      </p>
      <Typeahead />
    </main>
  );
}
