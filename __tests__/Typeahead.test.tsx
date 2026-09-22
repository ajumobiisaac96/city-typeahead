import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Typeahead } from '@/components/Typeahead';

type Deferred = { resolve: (value: unknown) => void };

const lagos = { id: 1, name: 'Lagos', country: 'Nigeria', admin: 'Lagos', latitude: 6.45, longitude: 3.4 };
const lisbon = { id: 2, name: 'Lisbon', country: 'Portugal', admin: null, latitude: 38.7, longitude: -9.1 };

function mockJsonOnce(results: unknown[]) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ results }),
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('does not search until two characters are typed', async () => {
  const user = userEvent.setup();
  render(<Typeahead />);

  await user.type(screen.getByRole('combobox'), 'L');

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });

  expect(global.fetch).not.toHaveBeenCalled();
});

test('debounces so a burst of typing makes a single request', async () => {
  const user = userEvent.setup();
  mockJsonOnce([lagos]);
  render(<Typeahead />);

  await user.type(screen.getByRole('combobox'), 'Lagos');

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
});

test('shows results and selects one with the keyboard', async () => {
  const user = userEvent.setup();
  mockJsonOnce([lagos, lisbon]);
  render(<Typeahead />);

  const input = screen.getByRole('combobox');
  await user.type(input, 'Lag');

  const option = await screen.findByText('Lagos');
  expect(option).toBeInTheDocument();

  await user.keyboard('{ArrowDown}{Enter}');
  expect(input).toHaveValue('Lagos, Lagos, Nigeria');
});

test('shows an empty state when nothing matches', async () => {
  const user = userEvent.setup();
  mockJsonOnce([]);
  render(<Typeahead />);

  await user.type(screen.getByRole('combobox'), 'zzzz');

  expect(await screen.findByText('No places match that search.')).toBeInTheDocument();
});

test('shows an error state when the request fails', async () => {
  const user = userEvent.setup();
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 502 });
  render(<Typeahead />);

  await user.type(screen.getByRole('combobox'), 'Lagos');

  expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
});

test('ignores a stale response that resolves after a newer one', async () => {
  const user = userEvent.setup();

  const firstResponse: Deferred = { resolve: () => {} };
  const slowFirst = new Promise((resolve) => {
    firstResponse.resolve = resolve;
  });

  (global.fetch as jest.Mock)
    .mockReturnValueOnce(slowFirst)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [lisbon] }) });

  render(<Typeahead />);
  const input = screen.getByRole('combobox');

  await user.type(input, 'Lag');
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

  await user.clear(input);
  await user.type(input, 'Lis');
  expect(await screen.findByText('Lisbon')).toBeInTheDocument();

  // The first request now finishes late with different data.
  await act(async () => {
    firstResponse.resolve({ ok: true, json: async () => ({ results: [lagos] }) });
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  expect(screen.queryByText('Lagos')).not.toBeInTheDocument();
  expect(screen.getByText('Lisbon')).toBeInTheDocument();
});
