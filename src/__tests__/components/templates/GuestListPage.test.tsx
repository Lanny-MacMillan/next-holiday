/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import GuestListPage from '@/components/templates/GuestListPage';
import { guestListConfigs } from '@/config/guestListConfigs';

const me = { sub: 'auth0|me', id: 'u1', name: 'Me', email: 'me@x.com' };
let shared: any;
jest.mock('@/hooks/useSharedHoliday', () => ({
  useSharedHoliday: () => shared,
}));

const ok = (value: unknown = {}) => ({ unwrap: () => Promise.resolve(value) });
const fail = (error: unknown) => ({ unwrap: () => Promise.reject(error) });
const states = {
  createGuestState: { isLoading: false },
  updateGuestState: { isLoading: false },
  editGuestState: { isLoading: false },
  deleteGuestState: { isLoading: false },
};
const mutations = {
  createGuest: jest.fn(),
  updateGuest: jest.fn(),
  editGuest: jest.fn(),
  deleteGuest: jest.fn(),
};
jest.mock('@/hooks/useGuestMutations', () => ({
  useGuestMutations: () => ({ ...mutations, ...states }),
}));
jest.mock('@/store/slices/homeSlice', () => ({
  updateGuestInHomeData: (payload: unknown) => ({
    type: 'home/updateGuest',
    payload,
  }),
}));
jest.mock('@/store/slices/addressBookSlice', () => ({
  fetchContacts: () => ({ type: 'addressBook/fetch' }),
  resetContacts: () => ({ type: 'addressBook/reset' }),
}));
jest.mock('@/config/formConfigs', () => ({
  getFormConfigEnhanced: (type: string, mode: string) => ({
    fields: [{ name: `${type}-${mode}` }],
  }),
}));
jest.mock('@/config/deleteModalConfigs', () => ({
  getDeleteConfig: () => ({ title: 'Delete Guest', message: 'Remove this guest?' }),
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
  default: ({ onClick }: any) => <button onClick={onClick}>Add New Guest</button>,
}));
jest.mock('@/components/cards/reservation/ReservationsTracker', () => ({
  __esModule: true,
  default: ({ title, guests }: any) => (
    <div>
      {title} ({guests.length})
    </div>
  ),
}));
jest.mock('@/components/common/RSVPSection', () => ({
  __esModule: true,
  default: ({ title, items, emptyMessage, renderItem }: any) => (
    <section aria-label={title}>
      {items.length === 0
        ? emptyMessage
        : items.map((item: any) => renderItem(item))}
    </section>
  ),
}));
jest.mock('@/components/cards/guest/GuestCardItem', () => ({
  __esModule: true,
  default: ({ guest, onToggle, onEdit, onDelete }: any) => (
    <div data-testid="guest">
      <span>{guest.name}</span>
      <button onClick={() => onToggle(guest.id)}>toggle {guest.name}</button>
      <button onClick={() => onEdit(guest)}>edit {guest.name}</button>
      <button onClick={() => onDelete(guest.id)}>delete {guest.name}</button>
    </div>
  ),
}));
jest.mock('@/components/modals/FormModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, onSubmit, initialValues, onClose }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <span data-testid="initial">{JSON.stringify(initialValues)}</span>
        <button
          onClick={() =>
            onSubmit({
              name: 'Rose',
              email: 'rose@x.com',
              rsvp_status: 'confirmed',
              notes: 'n',
            })
          }
        >
          submit {title}
        </button>
        <button onClick={() => onSubmit({ name: 'Ann' })}>
          submit minimal {title}
        </button>
        <button onClick={() => onSubmit({ name: ' ' })}>submit blank {title}</button>
        <button onClick={onClose}>close {title}</button>
      </div>
    ) : null,
}));
jest.mock('@/components/modals/DeleteModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div role="dialog" aria-label="Delete Guest">
        <button onClick={onConfirm}>confirm delete</button>
        <button onClick={onCancel}>cancel delete</button>
      </div>
    ) : null,
}));
jest.mock('@/components/modals/SortModal', () => ({
  __esModule: true,
  default: ({ isOpen, sortOptions, onSortChange }: any) =>
    isOpen ? (
      <div role="dialog" aria-label="Sort Guests">
        {sortOptions.map((o: any) => (
          <button key={o.value} onClick={() => onSortChange(o.value)}>
            sort {o.label}
          </button>
        ))}
      </div>
    ) : null,
}));

const guestList = (id: string, name: string, over: Record<string, any> = {}) => ({
  id,
  rsvpStatus: 'pending',
  notes: '',
  contact: {
    name,
    email: `${name.toLowerCase()}@x.com`,
    phone: '555',
    streetAddress: '1 Main',
  },
  ...over,
});

let store: ReturnType<typeof makeStore>;
const makeStore = () =>
  configureStore({
    reducer: {
      addressBook: () => ({
        contacts: [{ id: 'c1', name: 'Rose', email: 'contact@x.com', phone: '999' }],
      }),
      log: (state: any[] = [], action: any) =>
        action.type.startsWith('home/') ? [...state, action] : state,
    },
  });

const renderPage = (config: any = guestListConfigs.birthday) => {
  store = makeStore();
  return render(
    <Provider store={store}>
      <GuestListPage config={config} />
    </Provider>,
  );
};
const updates = () => (store.getState() as any).log.map((a: any) => a.payload);
const names = () =>
  screen.getAllByTestId('guest').map(n => n.textContent?.split('toggle')[0]);

beforeEach(() => {
  jest.clearAllMocks();
  shared = {
    holidayId: 'h1',
    holidayData: {
      guestLists: [
        guestList('a', 'Zoe', { rsvpStatus: 'confirmed' }),
        guestList('b', 'Adam'),
        guestList('c', 'Mia', { rsvpStatus: 'declined' }),
      ],
    },
    auth0User: me,
    homeInitialized: true,
    shareMembers: [],
  };
  mutations.createGuest.mockReturnValue(ok());
  mutations.updateGuest.mockReturnValue(ok());
  mutations.editGuest.mockReturnValue(ok({ id: 'server' }));
  mutations.deleteGuest.mockReturnValue(ok());
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('GuestListPage', () => {
  it('uses the config for the title, description and tracker', () => {
    renderPage(guestListConfigs['fourth-of-july']);

    expect(screen.getByRole('heading', { name: 'Guest List' })).toBeTruthy();
    expect(
      screen.getByText('Keep track of your Fourth of July guests!'),
    ).toBeTruthy();
    expect(screen.getByText('Fourth of July Guest Tracker (3)')).toBeTruthy();
  });

  it('shows a loading message until home data is ready', () => {
    shared.homeInitialized = false;
    renderPage();

    expect(screen.getByText('Loading guests...')).toBeTruthy();
    expect(screen.queryByTestId('guest')).toBeNull();
  });

  it('groups guests by RSVP and says so when a group is empty', () => {
    shared.holidayData = { guestLists: [guestList('a', 'Zoe')] };
    renderPage();

    expect(screen.getByRole('region', { name: 'Pending' }).textContent).toContain(
      'Zoe',
    );
    expect(screen.getByText('No confirmed RSVPs yet.')).toBeTruthy();
    expect(screen.getByText('No declined RSVPs yet.')).toBeTruthy();
  });

  it('skips empty entries and repeated ids, and names a guest with no contact', () => {
    shared.holidayData = {
      guestLists: [
        null,
        { id: '' },
        guestList('a', 'Zoe'),
        guestList('a', 'Zoe again'),
        { id: 'x', rsvpStatus: 'pending' },
      ],
    };
    renderPage();

    expect(screen.getAllByTestId('guest').length).toBe(2);
    expect(screen.getByText('Unknown Guest')).toBeTruthy();
    expect(screen.queryByText('Zoe again')).toBeNull();
  });

  describe('sorting', () => {
    it('keeps the stored order by default', () => {
      renderPage();

      expect(screen.getByRole('region', { name: 'Pending' }).textContent).toContain(
        'Adam',
      );
    });

    it.each([
      ['Name', 'Sorted by Name'],
      ['RSVP Status', 'Sorted by RSVP Status'],
      ['Email', 'Sorted by Email'],
    ])('sorts by %s', (label, line) => {
      renderPage();

      fireEvent.click(screen.getByText('open sort'));
      fireEvent.click(screen.getByText(`sort ${label}`));

      expect(screen.getByText(line)).toBeTruthy();
    });

    it('sorts guests by name within the page', () => {
      shared.holidayData = {
        guestLists: [guestList('a', 'Zoe'), guestList('b', 'Adam')],
      };
      renderPage();
      fireEvent.click(screen.getByText('open sort'));
      fireEvent.click(screen.getByText('sort Name'));

      expect(names()).toEqual(['Adam', 'Zoe']);
    });

    it('sorts guests by email within the page', () => {
      shared.holidayData = {
        guestLists: [
          guestList('a', 'Zoe', { contact: { name: 'Zoe', email: 'z@x.com' } }),
          guestList('b', 'Adam', { contact: { name: 'Adam' } }),
        ],
      };
      renderPage();
      fireEvent.click(screen.getByText('open sort'));
      fireEvent.click(screen.getByText('sort Email'));

      expect(names()).toEqual(['Adam', 'Zoe']);
    });

    it('lists pending first, then confirmed, then declined when sorted by RSVP', () => {
      renderPage();
      fireEvent.click(screen.getByText('open sort'));
      fireEvent.click(screen.getByText('sort RSVP Status'));

      expect(names()).toEqual(['Adam', 'Zoe', 'Mia']);
    });

    it('shows no sorted-by line when sort is None', () => {
      renderPage();
      fireEvent.click(screen.getByText('open sort'));
      fireEvent.click(screen.getByText('sort None'));

      expect(screen.queryByText(/Sorted by/)).toBeNull();
    });
  });

  describe('adding', () => {
    it('saves the RSVP that was chosen, plus the contact details, and confirms', async () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: 'Add New Guest' }));
      fireEvent.click(screen.getByText('submit Add New Guest'));

      await waitFor(() =>
        expect(mutations.createGuest).toHaveBeenCalledWith({
          holidayId: 'h1',
          payload: {
            name: 'Rose',
            email: 'rose@x.com',
            phone: '999',
            address: undefined,
            rsvpStatus: 'confirmed',
            notes: 'n',
          },
          auth0User: me,
        }),
      );
      expect(await screen.findByText('Guest added successfully!')).toBeTruthy();
      expect((store.getState() as any).log).toEqual([]);
      expect(screen.queryByRole('dialog', { name: 'Add New Guest' })).toBeNull();
    });

    it('defaults to pending when no RSVP is chosen', async () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: 'Add New Guest' }));
      fireEvent.click(screen.getByText('submit minimal Add New Guest'));

      await waitFor(() => expect(mutations.createGuest).toHaveBeenCalled());
      expect(mutations.createGuest.mock.calls[0][0].payload).toMatchObject({
        name: 'Ann',
        rsvpStatus: 'pending',
      });
    });

    it('ignores a guest with no name', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: 'Add New Guest' }));
      fireEvent.click(screen.getByText('submit blank Add New Guest'));

      expect(mutations.createGuest).not.toHaveBeenCalled();
    });

    it.each([
      [
        'nested',
        {
          data: { error: [{ message: 'Email is already tied to another contact' }] },
        },
        'Email is already tied to another contact',
      ],
      [
        'direct',
        { data: [{ message: 'Email is already tied to another contact' }] },
        'Email is already tied to another contact',
      ],
      [
        'text',
        { data: 'Email is already tied to another contact' },
        'Email is already tied to another contact',
      ],
      [
        'unrelated list',
        { data: { error: [{ message: 'nope' }] } },
        'Error creating guest. Please try again.',
      ],
      ['an error with a message', { message: 'boom' }, 'Error creating guest: boom'],
      ['nothing useful', {}, 'Error creating guest. Please try again.'],
    ])(
      'explains a %s failure and keeps the form open',
      async (_label, error, shown) => {
        mutations.createGuest.mockReturnValue(fail(error));
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Add New Guest' }));
        fireEvent.click(screen.getByText('submit Add New Guest'));

        expect(await screen.findByText(shown)).toBeTruthy();
        expect(screen.getByRole('dialog', { name: 'Add New Guest' })).toBeTruthy();
      },
    );

    it('closes the form without saving', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: 'Add New Guest' }));
      fireEvent.click(screen.getByText('close Add New Guest'));

      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('RSVP toggle', () => {
    it('confirms a pending guest straight away and saves it', async () => {
      renderPage();

      fireEvent.click(screen.getByText('toggle Adam'));

      await waitFor(() =>
        expect(mutations.updateGuest).toHaveBeenCalledWith({
          auth0User: me,
          holidayId: 'h1',
          guestId: 'b',
          isCompleted: true,
        }),
      );
      expect(updates()[0].updates).toMatchObject({
        rsvpStatus: 'confirmed',
        isCompleted: true,
      });
    });

    it('puts a confirmed guest back to pending', async () => {
      renderPage();

      fireEvent.click(screen.getByText('toggle Zoe'));

      await waitFor(() => expect(mutations.updateGuest).toHaveBeenCalled());
      expect(mutations.updateGuest.mock.calls[0][0].isCompleted).toBe(false);
      expect(updates()[0].updates.rsvpStatus).toBe('pending');
    });

    it('puts the guest back as it was when the save fails', async () => {
      mutations.updateGuest.mockReturnValue(fail(new Error('nope')));
      renderPage();

      fireEvent.click(screen.getByText('toggle Adam'));

      await waitFor(() => expect(updates().length).toBe(2));
      expect(updates()[1].updates.rsvpStatus).toBe('pending');
    });

    it('does nothing while the holiday has not been found', () => {
      shared.holidayId = null;
      renderPage();

      fireEvent.click(screen.getByText('toggle Adam'));

      expect(mutations.updateGuest).not.toHaveBeenCalled();
      expect(updates()).toEqual([]);
    });
  });

  describe('editing', () => {
    it('starts from the saved details, including the RSVP, and saves the changes', async () => {
      renderPage();

      fireEvent.click(screen.getByText('edit Zoe'));
      expect(JSON.parse(screen.getByTestId('initial').textContent!)).toEqual({
        name: 'Zoe',
        email: 'zoe@x.com',
        phone: '555',
        address: '1 Main',
        rsvp_status: 'confirmed',
        notes: '',
      });
      fireEvent.click(screen.getByText('submit Edit Guest'));

      await waitFor(() =>
        expect(mutations.editGuest).toHaveBeenCalledWith({
          holidayId: 'h1',
          guestId: 'a',
          payload: {
            name: 'Rose',
            email: 'rose@x.com',
            phone: undefined,
            address: undefined,
            rsvpStatus: 'confirmed',
            notes: 'n',
          },
          auth0User: me,
        }),
      );
      expect(await screen.findByText('Guest updated successfully!')).toBeTruthy();
      expect(updates().at(-1).updates).toEqual({ id: 'server' });
    });

    it('shows the edit straight away, keeping the old contact details a field was left blank', async () => {
      renderPage();

      fireEvent.click(screen.getByText('edit Zoe'));
      fireEvent.click(screen.getByText('submit Edit Guest'));

      await waitFor(() => expect(mutations.editGuest).toHaveBeenCalled());
      const optimistic = updates()[0].updates;
      expect(optimistic.contact).toMatchObject({
        name: 'Rose',
        email: 'rose@x.com',
        phone: '555',
        streetAddress: '1 Main',
      });
    });

    it('puts the guest back and explains when saving fails', async () => {
      mutations.editGuest.mockReturnValue(fail({ message: 'boom' }));
      renderPage();

      fireEvent.click(screen.getByText('edit Zoe'));
      fireEvent.click(screen.getByText('submit Edit Guest'));

      expect(await screen.findByText('Error updating guest: boom')).toBeTruthy();
      expect(updates().at(-1).updates.rsvpStatus).toBe('confirmed');
      expect(screen.getByRole('dialog', { name: 'Edit Guest' })).toBeTruthy();
    });

    it('can be closed without saving', () => {
      renderPage();

      fireEvent.click(screen.getByText('edit Zoe'));
      fireEvent.click(screen.getByText('close Edit Guest'));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(mutations.editGuest).not.toHaveBeenCalled();
    });
  });

  describe('deleting', () => {
    it('asks first and can be cancelled', () => {
      renderPage();

      fireEvent.click(screen.getByText('delete Zoe'));
      fireEvent.click(screen.getByText('cancel delete'));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(mutations.deleteGuest).not.toHaveBeenCalled();
    });

    it('deletes after confirming', async () => {
      renderPage();

      fireEvent.click(screen.getByText('delete Zoe'));
      fireEvent.click(screen.getByText('confirm delete'));

      await waitFor(() =>
        expect(mutations.deleteGuest).toHaveBeenCalledWith({
          holidayId: 'h1',
          guestId: 'a',
          auth0User: me,
        }),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('keeps the dialog open when deleting fails', async () => {
      mutations.deleteGuest.mockReturnValue(fail(new Error('nope')));
      renderPage();

      fireEvent.click(screen.getByText('delete Zoe'));
      fireEvent.click(screen.getByText('confirm delete'));

      await waitFor(() => expect(console.error).toHaveBeenCalled());
      expect(screen.getByRole('dialog', { name: 'Delete Guest' })).toBeTruthy();
    });
  });
});
