/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Suggestions, { type Suggestion } from '@/components/common/Suggestions';

const items: Suggestion[] = [
  { title: 'Hang lights', description: 'Along the roof', priority: 'high' },
  { title: 'Set the table', description: 'Plates and napkins', priority: 'medium' },
  { title: 'Make a banner', description: 'Welcome sign', priority: 'low' },
];

const renderIt = (over: Record<string, unknown> = {}) => {
  const props = {
    heading: 'Set up decorations',
    question: 'Would you like to add some common decorations?',
    noun: 'decorations',
    items,
    existingTitles: [] as string[],
    onAdd: jest.fn().mockResolvedValue(undefined),
    showPrompt: true,
    onDismissPrompt: jest.fn(),
    ...over,
  };
  render(<Suggestions {...(props as any)} />);
  return props;
};

const open = () =>
  fireEvent.click(
    screen.getByRole('button', { name: /Choose suggestions|Suggestions \(/ }),
  );
const dialog = () => screen.getByRole('dialog', { name: 'Suggested decorations' });
const checkbox = (title: string) =>
  within(dialog()).getByRole('checkbox', {
    name: new RegExp(title),
  }) as HTMLInputElement;

describe('the empty-page prompt', () => {
  it('asks, and offers to choose or skip', () => {
    const { onDismissPrompt } = renderIt();

    expect(screen.getByText('Set up decorations')).toBeTruthy();
    expect(
      screen.getByText('Would you like to add some common decorations?'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onDismissPrompt).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the picker from "Choose suggestions"', () => {
    renderIt();

    open();

    expect(dialog()).toBeTruthy();
  });
});

describe('after the prompt', () => {
  it('leaves a small button with how many suggestions are left', () => {
    renderIt({ showPrompt: false, existingTitles: ['Hang lights'] });

    expect(screen.getByRole('button', { name: '💡 Suggestions (2)' })).toBeTruthy();
    expect(screen.queryByText('Set up decorations')).toBeNull();
  });

  it('shows nothing once every suggestion has been added', () => {
    const { container } = render(
      <Suggestions
        heading="h"
        question="q"
        noun="decorations"
        items={items}
        existingTitles={items.map(i => i.title)}
        onAdd={jest.fn()}
        showPrompt={false}
        onDismissPrompt={jest.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('the picker', () => {
  it('lists every suggestion with its description and priority, all ticked to start', () => {
    renderIt();
    open();

    for (const item of items) {
      expect(within(dialog()).getByText(item.title)).toBeTruthy();
      expect(within(dialog()).getByText(item.description)).toBeTruthy();
      expect(checkbox(item.title).checked).toBe(true);
    }
    expect(within(dialog()).getByText('high')).toBeTruthy();
    expect(within(dialog()).getByText('3 of 3 selected')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add 3 selected' })).toBeTruthy();
  });

  it('shows what is already on the page as added, and cannot be picked again', () => {
    renderIt({ existingTitles: ['  hang LIGHTS '] });
    open();

    expect(checkbox('Hang lights').checked).toBe(true);
    expect(checkbox('Hang lights').disabled).toBe(true);
    expect(within(dialog()).getByText('Already added')).toBeTruthy();
    expect(within(dialog()).getByText('2 of 2 selected')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add 2 selected' })).toBeTruthy();
  });

  it('lets suggestions be unticked and ticked, updating the count and the button', () => {
    renderIt();
    open();

    fireEvent.click(checkbox('Set the table'));
    expect(within(dialog()).getByText('2 of 3 selected')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add 2 selected' })).toBeTruthy();

    fireEvent.click(checkbox('Set the table'));
    expect(within(dialog()).getByText('3 of 3 selected')).toBeTruthy();
  });

  it('clears everything, and selects everything again', () => {
    renderIt();
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(within(dialog()).getByText('0 of 3 selected')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Add 0 selected' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    expect(within(dialog()).getByText('3 of 3 selected')).toBeTruthy();
  });

  it('starts from a fresh selection each time it is opened', () => {
    renderIt();
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    open();

    expect(within(dialog()).getByText('3 of 3 selected')).toBeTruthy();
  });
});

describe('adding', () => {
  it('adds only the chosen suggestions, in list order, then closes and dismisses the prompt', async () => {
    const { onAdd, onDismissPrompt } = renderIt();
    open();
    fireEvent.click(checkbox('Set the table'));

    fireEvent.click(screen.getByRole('button', { name: 'Add 2 selected' }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0].map((i: Suggestion) => i.title)).toEqual([
      'Hang lights',
      'Make a banner',
    ]);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onDismissPrompt).toHaveBeenCalled();
  });

  it('does not offer what is already there', async () => {
    const { onAdd } = renderIt({ existingTitles: ['Hang lights'] });
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Add 2 selected' }));

    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0].map((i: Suggestion) => i.title)).toEqual([
      'Set the table',
      'Make a banner',
    ]);
  });

  it('locks the dialog and shows progress while it works', async () => {
    let finish!: () => void;
    const onAdd = jest.fn(() => new Promise<void>(resolve => (finish = resolve)));
    renderIt({ onAdd });
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Add 3 selected' }));

    expect(await screen.findByRole('button', { name: 'Adding...' })).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(checkbox('Hang lights').disabled).toBe(true);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeTruthy();

    finish();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keeps the dialog open, says so, and does not dismiss the prompt when adding fails', async () => {
    const onAdd = jest.fn().mockRejectedValue(new Error('nope'));
    const { onDismissPrompt } = renderIt({ onAdd });
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Add 3 selected' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(
      /Something went wrong/,
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(onDismissPrompt).not.toHaveBeenCalled();
    expect(
      (screen.getByRole('button', { name: 'Add 3 selected' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('does nothing when nothing is chosen', () => {
    const { onAdd } = renderIt();
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add 0 selected' }));

    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe('closing', () => {
  it.each([
    [
      'Cancel',
      () => fireEvent.click(screen.getByRole('button', { name: 'Cancel' })),
    ],
    [
      'the x button',
      () => fireEvent.click(screen.getByRole('button', { name: 'Close' })),
    ],
    ['the Escape key', () => fireEvent.keyDown(window, { key: 'Escape' })],
  ])('closes with %s without adding anything', (_label, close) => {
    const { onAdd, onDismissPrompt } = renderIt();
    open();

    close();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onAdd).not.toHaveBeenCalled();
    expect(onDismissPrompt).not.toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    renderIt();
    open();

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
