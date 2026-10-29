/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CardsPage from '@/components/templates/CardsPage';
import { cardPageConfigs } from '@/config/cardPageConfigs';

const me = { sub: 'auth0|me', id: 'u1', name: 'Me', email: 'me@x.com' };
let shared: any;
jest.mock('@/hooks/useSharedHoliday', () => ({
  useSharedHoliday: () => shared,
}));
const mutations = {
  createCard: jest.fn(),
  updateCard: jest.fn(),
  editCard: jest.fn(),
  deleteCard: jest.fn(),
};
jest.mock('@/hooks/useHolidayMutations', () => ({
  useHolidayMutations: () => mutations,
}));
jest.mock('@/store/slices/addressBookSlice', () => ({
  fetchContacts: () => ({ type: 'addressBook/fetch' }),
}));
jest.mock('@/utils/formTransformers', () => ({
  transformCardPayload: (values: any) => ({ ...values, transformed: true }),
}));
jest.mock('@/config/formConfigs', () => ({
  getFormConfigEnhanced: (type: string, mode: string) => ({
    fields: [{ name: `${type}-${mode}` }],
  }),
}));

jest.mock('@/components/common/HolidayPageHeader', () => ({
  __esModule: true,
  default: ({ title, description, onSortClick }: any) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
      <button onClick={onSortClick}>open sort</button>
    </header>
  ),
}));
jest.mock('@/components/common/AddButton', () => ({
  __esModule: true,
  default: ({ onClick }: any) => <button onClick={onClick}>Add New Card</button>,
}));
jest.mock('@/components/common/Footer', () => ({
  __esModule: true,
  default: () => <footer>footer</footer>,
}));
jest.mock('@/components/cards/MailCardStatus', () => ({
  __esModule: true,
  default: ({ totalCards, completedCards, incompleteCards }: any) => (
    <div>
      status {totalCards}/{completedCards}/{incompleteCards}
    </div>
  ),
}));
jest.mock('@/components/cards/MailCard', () => ({
  __esModule: true,
  default: ({ card, onToggleCompletion, onEditCard, onDeleteCard }: any) => (
    <div data-testid="card">
      <span>{card.recipient}</span>
      {card.assignedToName && <span>assigned {card.assignedToName}</span>}
      <button onClick={() => onToggleCompletion(card.id)}>
        toggle {card.recipient}
      </button>
      <button onClick={() => onEditCard(card)}>edit {card.recipient}</button>
      <button onClick={() => onDeleteCard(card.id)}>delete {card.recipient}</button>
    </div>
  ),
}));
jest.mock('@/components/modals/FormModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, onSubmit, initialValues, onClose }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <span data-testid="initial">{JSON.stringify(initialValues)}</span>
        <button onClick={() => onSubmit({ recipient: 'Rose', message: 'Hi' })}>
          submit {title}
        </button>
        <button onClick={() => onSubmit({ recipient: ' ', message: 'Hi' })}>
          submit blank {title}
        </button>
        <button onClick={onClose}>close {title}</button>
      </div>
    ) : null,
}));
jest.mock('@/components/modals/DeleteModal', () => ({
  __esModule: true,
  default: ({ isOpen, itemName, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div role="dialog" aria-label="Delete Card">
        <span>delete {itemName}?</span>
        <button onClick={onConfirm}>confirm delete</button>
        <button onClick={onCancel}>cancel delete</button>
      </div>
    ) : null,
}));
jest.mock('@/components/modals/SortModal', () => ({
  __esModule: true,
  default: ({ isOpen, sortOptions, onSortChange }: any) =>
    isOpen ? (
      <div role="dialog" aria-label="Sort Cards">
        {sortOptions.map((o: any) => (
          <button key={o.value} onClick={() => onSortChange(o.value)}>
            sort {o.label}
          </button>
        ))}
      </div>
    ) : null,
}));

const card = (id: string, recipient: string, over: Record<string, any> = {}) => ({
  id,
  recipient,
  message: '',
  isCompleted: false,
  ...over,
});

const renderPage = (config: any = cardPageConfigs.christmas) => {
  const store = configureStore({
    reducer: { addressBook: () => ({ contacts: [{ id: 'c1' }] }) },
  });
  return render(
    <Provider store={store}>
      <CardsPage config={config} />
    </Provider>,
  );
};

const order = () =>
  screen.getAllByTestId('card').map(n => n.textContent?.split('toggle')[0]);

beforeEach(() => {
  jest.clearAllMocks();
  shared = {
    holidayId: 'h1',
    holidayData: {
      cards: [
        card('a', 'Zoe', { message: 'b msg' }),
        card('b', 'Adam', { message: 'z msg' }),
        card('c', 'Mia', { isCompleted: true, message: 'a msg' }),
      ],
    },
    auth0User: me,
    homeInitialized: true,
    shareMembers: [
      { userId: 'auth0|me', uuid: 'u1', name: 'Me' },
      { userId: 'auth0|sam', uuid: 'u2', name: '', email: 'sam@x.com' },
    ],
  };
  Object.values(mutations).forEach(m => m.mockReset().mockResolvedValue({}));
});

describe('CardsPage', () => {
  it('uses the config for the title and description', () => {
    renderPage(cardPageConfigs.valentines);

    expect(screen.getByRole('heading', { name: 'Valentines Cards' })).toBeTruthy();
    expect(screen.getByText('Keep track of your Valentines cards!')).toBeTruthy();
  });

  it('shows a loading message until home data is ready, still with the header', () => {
    shared.homeInitialized = false;
    renderPage();

    expect(screen.getByText('Loading cards...')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Christmas Cards' })).toBeTruthy();
    expect(screen.queryByTestId('card')).toBeNull();
  });

  it('invites the user to add a first card when there are none, and opens the form', () => {
    shared.holidayData = { cards: [] };
    renderPage();

    expect(screen.getByText('No cards added yet.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add your first card' }));
    expect(screen.getByRole('dialog', { name: 'Add New Card' })).toBeTruthy();
  });

  it('splits cards into those to send and those sent, and counts them', () => {
    renderPage();

    expect(screen.getByText('Cards to Send (2)')).toBeTruthy();
    expect(screen.getByText('Sent Cards (1)')).toBeTruthy();
    expect(screen.getByText('status 3/1/2')).toBeTruthy();
  });

  it('names the person a card is assigned to, by name, then email, then id', () => {
    shared.holidayData.cards = [
      card('a', 'A', { assignedTo: 'u1' }),
      card('b', 'B', { assignedTo: 'u2' }),
      card('c', 'C', { assignedTo: 'gone-id' }),
      card('d', 'D'),
    ];
    renderPage();

    expect(screen.getByText('assigned Me')).toBeTruthy();
    expect(screen.getByText('assigned sam@x.com')).toBeTruthy();
    expect(screen.getByText('assigned gone-id')).toBeTruthy();
    expect(screen.getAllByText(/^assigned/).length).toBe(3);
  });

  describe('sorting', () => {
    it('starts sorted by recipient', () => {
      renderPage();

      expect(order().slice(0, 2)).toEqual(['Adam', 'Zoe']);
    });

    it('sorts by message', () => {
      renderPage();

      fireEvent.click(screen.getByText('open sort'));
      fireEvent.click(screen.getByText('sort Message'));

      expect(order().slice(0, 2)).toEqual(['Zoe', 'Adam']);
    });

    it('can put sent cards after unsent ones', () => {
      shared.holidayData.cards = [
        card('a', 'A', { isCompleted: true }),
        card('b', 'B'),
      ];
      renderPage();

      fireEvent.click(screen.getByText('open sort'));
      fireEvent.click(screen.getByText('sort Completion Status'));

      expect(screen.getByText('Cards to Send (1)')).toBeTruthy();
      expect(order()).toEqual(['B', 'A']);
    });

    it('keeps cards without a recipient or message from breaking the sort', () => {
      shared.holidayData.cards = [{ id: 'x', isCompleted: false }, card('y', 'Y')];
      renderPage();

      fireEvent.click(screen.getByText('open sort'));
      fireEvent.click(screen.getByText('sort Message'));

      expect(screen.getAllByTestId('card').length).toBe(2);
    });
  });

  describe('adding', () => {
    it('adds a card and confirms with a toast', async () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: 'Add New Card' }));
      fireEvent.click(screen.getByText('submit Add New Card'));

      await waitFor(() =>
        expect(mutations.createCard).toHaveBeenCalledWith({
          recipient: 'Rose',
          message: 'Hi',
          transformed: true,
        }),
      );
      expect(await screen.findByText('Card added successfully!')).toBeTruthy();
      expect(screen.queryByRole('dialog', { name: 'Add New Card' })).toBeNull();
    });

    it('asks for both fields when one is missing, without saving', async () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: 'Add New Card' }));
      fireEvent.click(screen.getByText('submit blank Add New Card'));

      expect(
        await screen.findByText('Please fill in both Recipient and Message fields'),
      ).toBeTruthy();
      expect(mutations.createCard).not.toHaveBeenCalled();
    });

    it.each([
      [
        'an assignment problem',
        'Invalid uuid',
        'Assignment error: Please try selecting the assignee again',
      ],
      ['anything else', 'boom', 'Error creating card. Please try again.'],
    ])('keeps the form open and explains %s', async (_label, message, shown) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mutations.createCard.mockRejectedValue(new Error(message));
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: 'Add New Card' }));
      fireEvent.click(screen.getByText('submit Add New Card'));

      expect(await screen.findByText(shown)).toBeTruthy();
      expect(screen.getByRole('dialog', { name: 'Add New Card' })).toBeTruthy();
    });

    it('closes the form without saving', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: 'Add New Card' }));
      fireEvent.click(screen.getByText('close Add New Card'));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(mutations.createCard).not.toHaveBeenCalled();
    });
  });

  describe('editing', () => {
    it('starts from the saved values and saves the changes', async () => {
      shared.holidayData.cards[0] = card('a', 'Zoe', {
        message: 'hello',
        address: '1 Main St',
        notes: 'n',
        assignedTo: 'u2',
      });
      renderPage();

      fireEvent.click(screen.getByText('edit Zoe'));
      expect(JSON.parse(screen.getByTestId('initial').textContent!)).toEqual({
        recipient: 'Zoe',
        message: 'hello',
        address: '1 Main St',
        notes: 'n',
        assigned_to: 'u2',
      });
      fireEvent.click(screen.getByText('submit Edit Card'));

      await waitFor(() =>
        expect(mutations.editCard).toHaveBeenCalledWith('a', {
          recipient: 'Rose',
          message: 'Hi',
          transformed: true,
        }),
      );
      expect(await screen.findByText('Card updated successfully!')).toBeTruthy();
      expect(screen.queryByRole('dialog', { name: 'Edit Card' })).toBeNull();
    });

    it('keeps the edit open and explains when saving fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mutations.editCard.mockRejectedValue(new Error('boom'));
      renderPage();

      fireEvent.click(screen.getByText('edit Zoe'));
      fireEvent.click(screen.getByText('submit Edit Card'));

      expect(
        await screen.findByText('Error updating card. Please try again.'),
      ).toBeTruthy();
      expect(screen.getByRole('dialog', { name: 'Edit Card' })).toBeTruthy();
    });

    it('can be closed without saving', () => {
      renderPage();

      fireEvent.click(screen.getByText('edit Zoe'));
      fireEvent.click(screen.getByText('close Edit Card'));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(mutations.editCard).not.toHaveBeenCalled();
    });
  });

  describe('marking sent', () => {
    it('marks an unsent card sent and a sent card unsent', async () => {
      renderPage();

      fireEvent.click(screen.getByText('toggle Zoe'));
      fireEvent.click(screen.getByText('toggle Mia'));

      await waitFor(() => expect(mutations.updateCard).toHaveBeenCalledTimes(2));
      expect(mutations.updateCard).toHaveBeenCalledWith('a', true);
      expect(mutations.updateCard).toHaveBeenCalledWith('c', false);
    });

    it('carries on when the save fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mutations.updateCard.mockRejectedValue(new Error('nope'));
      renderPage();

      fireEvent.click(screen.getByText('toggle Zoe'));

      await waitFor(() => expect(console.error).toHaveBeenCalled());
    });
  });

  describe('deleting', () => {
    it('asks first, naming the recipient, and can be cancelled', () => {
      renderPage();

      fireEvent.click(screen.getByText('delete Zoe'));
      expect(screen.getByText('delete Zoe?')).toBeTruthy();

      fireEvent.click(screen.getByText('cancel delete'));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(mutations.deleteCard).not.toHaveBeenCalled();
    });

    it('deletes after confirming', async () => {
      renderPage();

      fireEvent.click(screen.getByText('delete Zoe'));
      fireEvent.click(screen.getByText('confirm delete'));

      await waitFor(() => expect(mutations.deleteCard).toHaveBeenCalledWith('a'));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('keeps the dialog open when deleting fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mutations.deleteCard.mockRejectedValue(new Error('nope'));
      renderPage();

      fireEvent.click(screen.getByText('delete Zoe'));
      fireEvent.click(screen.getByText('confirm delete'));

      await waitFor(() => expect(console.error).toHaveBeenCalled());
      expect(screen.getByRole('dialog', { name: 'Delete Card' })).toBeTruthy();
    });
  });

  it('shows the footer', () => {
    renderPage();

    expect(within(document.body).getByText('footer')).toBeTruthy();
  });
});
