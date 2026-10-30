/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import GiftCardItem from '@/components/cards/gift/GiftCardItem';

const gift = (over: Record<string, any> = {}) => ({
  id: 'g1',
  name: 'Scarf',
  recipient: 'Grandma',
  price: 25,
  isCompleted: false,
  ...over,
});

const renderItem = (
  props: Record<string, any> = {},
  display: { displayMode?: string; theme?: string } = {},
) => {
  const handlers = { onToggle: jest.fn(), onEdit: jest.fn(), onDelete: jest.fn() };
  const store = configureStore({
    reducer: {
      theme: () => ({
        settings: { displayMode: display.displayMode, theme: display.theme },
      }),
      userPreferences: () => ({ preferences: {} }),
    },
  });
  render(
    <Provider store={store}>
      <ul>
        <GiftCardItem gift={gift() as any} {...handlers} {...props} />
      </ul>
    </Provider>,
  );
  return handlers;
};

describe('GiftCardItem in professional mode', () => {
  it('shows the gift with its recipient, price and store', () => {
    renderItem({ gift: gift({ store: 'Macy’s', price: 25 }) });

    expect(screen.getByText('Scarf')).toBeTruthy();
    expect(screen.getByText('For: Grandma')).toBeTruthy();
    expect(screen.getByText('$25.00')).toBeTruthy();
    expect(screen.getByText('Store: Macy’s')).toBeTruthy();
  });

  it('hides the recipient when it is Unknown and skips empty extras', () => {
    renderItem({ gift: gift({ recipient: 'Unknown', price: 0 }) });

    expect(screen.queryByText(/For:/)).toBeNull();
    expect(screen.queryByText(/Store:/)).toBeNull();
    expect(screen.queryByText(/Assigned to/)).toBeNull();
  });

  it('shows who it is assigned to, its notes, description and link', () => {
    renderItem({
      gift: gift({
        assignedTo: 'u2',
        assignedToName: 'Sam',
        notes: 'Blue one',
        description: 'Wool',
        productLink: 'https://shop.test/scarf',
      }),
    });

    expect(screen.getByText(/Assigned to: Sam/)).toBeTruthy();
    expect(screen.getByText('Blue one')).toBeTruthy();
    expect(screen.getByText('Wool')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Link/ }).getAttribute('href')).toBe(
      'https://shop.test/scarf',
    );
  });

  it('shows the completed date only on a completed gift', () => {
    renderItem({
      gift: gift({ completedDate: '2030-01-02T12:00:00Z', isCompleted: true }),
      isCompleted: true,
    });

    expect(screen.getByText(/Completed:/)).toBeTruthy();
  });

  it('does not show a completed date on a gift that is not completed', () => {
    renderItem({ gift: gift({ completedDate: '2030-01-02T12:00:00Z' }) });

    expect(screen.queryByText(/Completed:/)).toBeNull();
  });

  it('ticks the gift off when the row is clicked', () => {
    const { onToggle } = renderItem();

    fireEvent.click(screen.getByText('Scarf'));
    expect(onToggle).toHaveBeenCalledWith('g1');
  });

  it('edits and deletes without also ticking the gift off', () => {
    const { onToggle, onEdit, onDelete } = renderItem();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'g1' }));
    expect(onDelete).toHaveBeenCalledWith('g1');
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('following the link does not tick the gift off', () => {
    const { onToggle } = renderItem({
      gift: gift({ productLink: 'https://shop.test/scarf' }),
    });

    fireEvent.click(screen.getByRole('link', { name: /Link/ }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('disables edit and delete while something is saving', () => {
    renderItem({ loading: true });

    expect(
      (screen.getByRole('button', { name: 'Edit' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('draws a coloured left border and a checked box for a completed gift', () => {
    renderItem({
      gift: gift({ isCompleted: true }),
      isCompleted: true,
      borderColor: 'rgb(1, 2, 3)',
      theme: { accentColor: '#22c55e' },
    });

    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('listitem').style.borderLeftColor).toBe('rgb(1, 2, 3)');
  });
});

describe('GiftCardItem in gamified mode', () => {
  it('shows no price icon, whichever way it is switched on', () => {
    renderItem({ gift: gift({ price: 150 }) }, { displayMode: 'gamified' });
    expect(screen.queryByText('💎')).toBeNull();

    renderItem({ gamified: true });
    expect(screen.queryByText('🎀')).toBeNull();
  });

  it('shows the gift details and the assignee', () => {
    renderItem(
      {
        gift: gift({
          assignedToName: 'Sam',
          store: 'Macy’s',
          notes: 'Blue',
          description: 'Wool',
          productLink: 'https://shop.test/scarf',
        }),
      },
      { displayMode: 'gamified' },
    );

    expect(screen.getByText('For: Grandma')).toBeTruthy();
    expect(screen.getByText(/Assigned to: Sam/)).toBeTruthy();
    expect(screen.getByText('Store: Macy’s')).toBeTruthy();
    expect(screen.getByText('Blue')).toBeTruthy();
    expect(screen.getByText('Wool')).toBeTruthy();
  });

  it('uses the holiday colour given, and toggles, edits and deletes separately', () => {
    const { onToggle, onEdit, onDelete } = renderItem(
      { gamifiedBackgroundColor: 'bg-gradient-to-br from-red-400 to-red-600' },
      { displayMode: 'gamified', theme: 'dark' },
    );

    expect(screen.getByRole('listitem').className).toContain('from-red-400');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByTitle('Delete gift'));
    expect(onEdit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith('g1');
    expect(onToggle).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Scarf'));
    expect(onToggle).toHaveBeenCalledWith('g1');
  });

  it('strikes through and fades a completed gift and shows when it was done', () => {
    renderItem(
      {
        gift: gift({ isCompleted: true, completedDate: '2030-01-02T12:00:00Z' }),
        isCompleted: true,
      },
      { displayMode: 'gamified' },
    );

    expect(screen.getByText('Scarf').className).toContain('line-through');
    expect(screen.getByText(/Completed:/)).toBeTruthy();
  });
});
