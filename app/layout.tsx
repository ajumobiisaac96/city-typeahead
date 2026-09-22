import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Place typeahead',
  description: 'A debounced, accessible autocomplete search for cities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
