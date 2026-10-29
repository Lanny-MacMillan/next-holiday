/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MailCard from '@/components/cards/MailCard';

const card = (over: Record<string, any> = {}) => ({
  id: 'c1',
  recipient: 'Aunt Rose',
  message: 'Merry Christmas!',
  address: '1 Main St',
  isCompleted: false,
  ...over,
});

const renderCard = (props: Record<string, any> = {}, displayMode?: string) => {
  const handlers = {
    onToggleCompletion: jest.fn(),
    onEditCard: jest.fn(),
    onDeleteCard: jest.fn(),
  };
  const store = configureStore({
    reducer: {
      theme: () => ({ settings: { displayMode, theme: 'light' } }),
      userPreferences: () => ({ preferences: {} }),
    },
  });
  const view = render(
    <Provider store={store}>
      <MailCard card={card() as any} {...handlers} {...props} />
    </Provider>,
  );
  return { ...handlers, ...view };
};

describe.each([
  ['professional', undefined],
  ['gamified', 'gamified'],
])('MailCard in %s mode', (_name, mode) => {
  it('shows who the card is for, the message and the address', () => {
    renderCard({}, mode);

    expect(screen.getByRole('heading', { name: 'Aunt Rose' })).toBeTruthy();
    expect(screen.getByText(/Merry Christmas!/)).toBeTruthy();
    expect(screen.getByText(/1 Main St/)).toBeTruthy();
  });

  it('leaves out the message, address and assignee when there are none', () => {
    renderCard({ card: card({ message: '', address: '' }) }, mode);

    expect(screen.queryByText(/Merry/)).toBeNull();
    expect(screen.queryByText(/Main St/)).toBeNull();
    expect(screen.queryByText(/Assigned to/)).toBeNull();
  });

  it('shows who it is assigned to', () => {
    renderCard({ card: card({ assignedToName: 'Sam' }) }, mode);

    expect(screen.getByText(/Assigned to: Sam/)).toBeTruthy();
  });

  it('offers Mark Sent on an unsent card and a Sent badge on a sent one', () => {
    renderCard({}, mode);
    expect(screen.getByRole('button', { name: 'Mark Sent' })).toBeTruthy();
    expect(screen.queryByText('Sent', { selector: 'span' })).toBeNull();
  });

  it('shows a sent card as sent, struck through', () => {
    renderCard({ card: card({ isCompleted: true }) }, mode);

    expect(screen.getByText('Sent', { selector: 'span' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Aunt Rose' }).className).toContain(
      'line-through',
    );
  });

  it('marks sent, edits and deletes, each separately', () => {
    const { onToggleCompletion, onEditCard, onDeleteCard } = renderCard({}, mode);

    fireEvent.click(screen.getByRole('button', { name: 'Mark Sent' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onToggleCompletion).toHaveBeenCalledWith('c1');
    expect(onEditCard).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }));
    expect(onDeleteCard).toHaveBeenCalledWith('c1');
  });
});

describe('MailCard colours', () => {
  it.each([
    ['bg-gradient-to-br from-pink-400 to-pink-600', 'bg-pink-300'],
    ['bg-red-500', 'bg-red-300'],
    ['bg-yellow-500', 'bg-yellow-300'],
    ['bg-blue-500', 'bg-blue-300'],
    ['bg-purple-500', 'bg-purple-300'],
    ['bg-teal-500', 'bg-pink-300'],
    [undefined, 'bg-pink-300'],
  ])('tints the message for holiday colour %s', (holidayColor, tint) => {
    renderCard({ holidayColor });

    expect(screen.getByText(/Merry Christmas!/).parentElement!.className).toContain(
      tint,
    );
  });

  it.each([
    ['bg-blue-500', 'card-events-fathers-day'],
    ['bg-green-500', 'card-events-christmas'],
    ['bg-red-500', 'card-events-fourth-of-july'],
    ['bg-purple-500', 'card-events-easter'],
    ['bg-orange-500', 'card-events-new-year'],
    ['bg-yellow-500', 'card-events-birthday'],
    ['bg-amber-500', 'card-events-birthday'],
    ['bg-teal-500', 'card-valentines'],
    [undefined, 'card-valentines'],
  ])('uses the card style for holiday colour %s', (holidayColor, cls) => {
    const { container } = renderCard({ holidayColor });

    expect((container.firstElementChild as HTMLElement).className).toContain(cls);
  });

  it('uses the holiday colour as the background in gamified mode, with a default', () => {
    const { container, unmount } = renderCard(
      { holidayColor: 'bg-gradient-to-br from-red-400 to-red-600' },
      'gamified',
    );
    expect((container.firstElementChild as HTMLElement).className).toContain(
      'from-red-400',
    );
    unmount();

    const second = renderCard({}, 'gamified');
    expect((second.container.firstElementChild as HTMLElement).className).toContain(
      'from-pink-300',
    );
  });
});
