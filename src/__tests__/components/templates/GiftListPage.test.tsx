/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import GiftListPage from '@/components/templates/GiftListPage';
import { giftListConfigs } from '@/config/giftListConfigs';

const auth0User = { sub: 'auth0|me', id: 'u1', name: 'Me', email: 'me@x.com' };
let pageData: any;
jest.mock('@/hooks/useHolidayPageData', () => ({
  useHolidayPageData: () => pageData,
}));

const mutations = {
  createGift: jest.fn(),
  editGift: jest.fn(),
  updateGift: jest.fn(),
  deleteGift: jest.fn(),
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
};
const useHolidayMutations = jest.fn(() => mutations);
jest.mock('@/hooks/useHolidayMutations', () => ({
  useHolidayMutations: (...a: unknown[]) => (useHolidayMutations as any)(...a),
}));

jest.mock('@/store/selectors/home', () => ({
  selectHolidayPrefById: () => undefined,
}));
jest.mock('@/store/slices/addressBookSlice', () => ({
  fetchContacts: () => ({ type: 'addressBook/fetch' }),
}));
jest.mock('@/store/slices/sharesSlice', () => ({
  refreshShares: () => ({ type: 'shares/refresh' }),
}));
jest.mock('@/utils/formTransformers', () => ({
  transformGiftPayload: (values: any) => ({ ...values, transformed: true }),
}));
jest.mock('@/config/formConfigs', () => ({
  getFormConfigEnhanced: (type: string, mode: string) => ({
    fields: [{ name: `${type}-${mode}` }],
  }),
}));

jest.mock('@/components/common/BudgetDisplay', () => ({
  BudgetDisplay: ({ holiday }: any) => <div>Budget for {holiday}</div>,
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
  default: ({ title, onClick }: any) => (
    <button onClick={onClick}>Add {title}</button>
  ),
}));
jest.mock('@/components/cards/gift/GiftCardItem', () => ({
  __esModule: true,
  default: ({ gift, onToggle, onEdit, onDelete }: any) => (
    <div data-testid="gift">
      <span>{gift.name}</span>
      <button onClick={() => onToggle(gift.id)}>toggle {gift.name}</button>
      <button onClick={() => onEdit(gift)}>edit {gift.name}</button>
      <button onClick={() => onDelete(gift.id)}>delete {gift.name}</button>
    </div>
  ),
}));
jest.mock('@/components/modals/FormModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, onSubmit, initialValues, shareMembers }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <span data-testid="initial">{JSON.stringify(initialValues)}</span>
        <span data-testid="members">{JSON.stringify(shareMembers)}</span>
        <button onClick={() => onSubmit({ name: 'Scarf', recipient: 'Ada' })}>
          submit {title}
        </button>
        <button onClick={() => onSubmit({ name: ' ', recipient: 'Ada' })}>
          submit blank {title}
        </button>
      </div>
    ) : null,
}));
jest.mock('@/components/modals/DeleteModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, message, onConfirm }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <span>{message}</span>
        <button onClick={onConfirm}>confirm delete</button>
      </div>
    ) : null,
}));
jest.mock('@/components/modals/SortModal', () => ({
  __esModule: true,
  default: ({ isOpen, sortOptions, onSortChange, title }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {sortOptions.map((o: any) => (
          <button key={o.value} onClick={() => onSortChange(o.value)}>
            sort {o.label}
          </button>
        ))}
      </div>
    ) : null,
}));

const gift = (id: string, over: Record<string, any> = {}) => ({
  id,
  name: `Gift ${id}`,
  recipient: 'Zed',
  store: '',
  price: 10,
  isCompleted: false,
  ...over,
});

const renderPage = (config: any, shares: any[] = []) => {
  const store = configureStore({
    reducer: {
      addressBook: () => ({ contacts: [{ id: 'c1' }] }),
      shares: () => ({ shares }),
    },
  });
  return render(
    <Provider store={store}>
      <GiftListPage config={config} />
    </Provider>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  pageData = {
    holidayId: 'h1',
    holidayData: {
      gifts: [
        gift('a', { recipient: 'Mia', price: 50, store: 'Zoo' }),
        gift('b', { recipient: 'Ada', price: 5, store: 'Ace' }),
        gift('c', { isCompleted: true }),
      ],
    },
    auth0User,
    homeInitialized: true,
  };
  mutations.createGift.mockResolvedValue({});
  mutations.editGift.mockResolvedValue({});
  mutations.updateGift.mockResolvedValue({});
  mutations.deleteGift.mockResolvedValue({});
});

const names = () =>
  screen.getAllByTestId('gift').map(n => n.textContent?.split('toggle')[0]);

describe('GiftListPage', () => {
  it('shows a loading message in the holiday wording until home data is ready', () => {
    pageData.homeInitialized = false;
    renderPage(giftListConfigs.easter);

    expect(screen.getByText('Loading basket items...')).toBeTruthy();
    expect(screen.queryByTestId('gift')).toBeNull();
  });

  it('uses the config for the title, description, budget and wording', () => {
    renderPage(giftListConfigs.easter);

    expect(screen.getByRole('heading', { name: 'Easter Basket' })).toBeTruthy();
    expect(
      screen.getByText('Keep track of Easter basket items and purchases!'),
    ).toBeTruthy();
    expect(screen.getByText('Budget for Easter')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Basket Item' })).toBeTruthy();
  });

  it('splits gifts into Incomplete and Completed with counts', () => {
    renderPage(giftListConfigs.christmas);

    expect(screen.getByText('Incomplete (2)')).toBeTruthy();
    expect(screen.getByText('Completed (1)')).toBeTruthy();
  });

  it('says so when everything is done or nothing is', () => {
    pageData.holidayData = { gifts: [] };
    renderPage(giftListConfigs.hanukkah);

    expect(screen.getByText('All gifts completed! 🕯️')).toBeTruthy();
    expect(screen.getByText('No completed gifts yet.')).toBeTruthy();
  });

  it.each([
    ['Recipient', ['Gift b', 'Gift a']],
    ['Store', ['Gift b', 'Gift a']],
    ['Price: High to Low', ['Gift a', 'Gift b']],
    ['Price: Low to High', ['Gift b', 'Gift a']],
  ])('sorts by %s', (label, expected) => {
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByText('open sort'));
    fireEvent.click(screen.getByText(`sort ${label}`));

    expect(names().slice(0, 2)).toEqual(expected);
    expect(screen.getByText(`Sorted by ${label}`)).toBeTruthy();
  });

  it('keeps the stored order and shows no sorted-by line when sort is None', () => {
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByText('open sort'));
    fireEvent.click(screen.getByText('sort None'));

    expect(names().slice(0, 2)).toEqual(['Gift a', 'Gift b']);
    expect(screen.queryByText(/Sorted by/)).toBeNull();
  });

  it('adds a gift and confirms with a toast', async () => {
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByRole('button', { name: 'Add Gift' }));
    fireEvent.click(screen.getByText('submit Add New Gift'));

    await waitFor(() =>
      expect(mutations.createGift).toHaveBeenCalledWith({
        name: 'Scarf',
        recipient: 'Ada',
        transformed: true,
      }),
    );
    expect(await screen.findByText('Gift added successfully!')).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Add New Gift' })).toBeNull();
  });

  it('ignores a submission with no name', () => {
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByRole('button', { name: 'Add Gift' }));
    fireEvent.click(screen.getByText('submit blank Add New Gift'));

    expect(mutations.createGift).not.toHaveBeenCalled();
  });

  it.each([
    [
      'address book problem',
      'No contact in address book',
      'Please select a recipient from the address book',
    ],
    [
      'invalid assignee',
      'Invalid uuid',
      'Assignment error: Please try selecting the assignee again',
    ],
    ['anything else', 'boom', 'Error creating gift. Please try again.'],
  ])('tells the user about a %s when adding fails', async (_l, message, shown) => {
    mutations.createGift.mockRejectedValue(new Error(message));
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByRole('button', { name: 'Add Gift' }));
    fireEvent.click(screen.getByText('submit Add New Gift'));

    expect(await screen.findByText(shown)).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Add New Gift' })).toBeTruthy();
  });

  it('uses the item name in messages for other kinds of list', async () => {
    mutations.createGift.mockRejectedValue('not an error object');
    renderPage(giftListConfigs.easter);

    fireEvent.click(screen.getByRole('button', { name: 'Add Basket Item' }));
    fireEvent.click(screen.getByText('submit Add New Basket Item'));

    expect(
      await screen.findByText('Error creating basket item. Please try again.'),
    ).toBeTruthy();
  });

  it('edits a gift, starting from its saved values', async () => {
    pageData.holidayData.gifts[0] = gift('a', {
      price: 12,
      productLink: 'http://x',
      assignedTo: 'u2',
      description: 'd',
      notes: 'n',
    });
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByText('edit Gift a'));
    expect(JSON.parse(screen.getByTestId('initial').textContent!)).toMatchObject({
      name: 'Gift a',
      price: '12',
      product_link: 'http://x',
      assigned_to: 'u2',
    });
    fireEvent.click(screen.getByText('submit Edit Gift'));

    await waitFor(() =>
      expect(mutations.editGift).toHaveBeenCalledWith('a', {
        name: 'Scarf',
        recipient: 'Ada',
        transformed: true,
      }),
    );
    expect(await screen.findByText('Gift updated successfully!')).toBeTruthy();
  });

  it('keeps the edit open and says so when saving fails', async () => {
    mutations.editGift.mockRejectedValue(new Error('boom'));
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByText('edit Gift a'));
    fireEvent.click(screen.getByText('submit Edit Gift'));

    expect(
      await screen.findByText('Error updating gift. Please try again.'),
    ).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Edit Gift' })).toBeTruthy();
  });

  it('ticks a gift off and back', async () => {
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByText('toggle Gift a'));
    fireEvent.click(screen.getByText('toggle Gift c'));

    await waitFor(() => expect(mutations.updateGift).toHaveBeenCalledTimes(2));
    expect(mutations.updateGift).toHaveBeenCalledWith('a', true);
    expect(mutations.updateGift).toHaveBeenCalledWith('c', false);
  });

  it('survives a failed toggle', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mutations.updateGift.mockRejectedValue(new Error('nope'));
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByText('toggle Gift a'));

    await waitFor(() => expect(console.error).toHaveBeenCalled());
  });

  it('asks before deleting, naming the gift, and can be cancelled', () => {
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByText('delete Gift a'));
    expect(
      screen.getByText(/Are you sure you want to delete "Gift a"\?/),
    ).toBeTruthy();
    expect(mutations.deleteGift).not.toHaveBeenCalled();
  });

  it('deletes after confirming', async () => {
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByText('delete Gift a'));
    fireEvent.click(screen.getByText('confirm delete'));

    await waitFor(() => expect(mutations.deleteGift).toHaveBeenCalledWith('a'));
    await waitFor(() => expect(screen.queryByText('confirm delete')).toBeNull());
  });

  it('keeps the delete dialog open when deleting fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mutations.deleteGift.mockRejectedValue(new Error('nope'));
    renderPage(giftListConfigs.christmas);

    fireEvent.click(screen.getByText('delete Gift a'));
    fireEvent.click(screen.getByText('confirm delete'));

    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(screen.getByText('confirm delete')).toBeTruthy();
  });

  it("works on the owner's holiday when it is shared with the user", () => {
    renderPage(giftListConfigs.birthday, [
      {
        holidayKey: 'birthday',
        holidayId: 'owners-holiday',
        members: [{ userId: 'auth0|other', name: 'Other' }],
      },
      { holidayKey: 'christmas', holidayId: 'not-this', members: [] },
    ]);

    expect(useHolidayMutations).toHaveBeenCalledWith({
      holidayId: 'owners-holiday',
      auth0User,
    });
  });

  it('lists the current user first as owner, then the other members', () => {
    renderPage(giftListConfigs.birthday, [
      {
        holidayKey: 'birthday',
        holidayId: 'h1',
        members: [
          { userId: 'auth0|other', name: 'Other' },
          { userId: 'auth0|me', name: 'Me (from share)' },
        ],
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Add Gift' }));

    const members = JSON.parse(screen.getByTestId('members').textContent!);
    expect(members.map((m: any) => [m.userId, m.role ?? null])).toEqual([
      ['auth0|me', 'owner'],
      ['auth0|other', null],
    ]);
  });

  it('adds the current user as owner when the share does not list them', () => {
    renderPage(giftListConfigs.birthday);
    fireEvent.click(screen.getByRole('button', { name: 'Add Gift' }));

    const members = JSON.parse(screen.getByTestId('members').textContent!);
    expect(members).toEqual([
      {
        userId: 'auth0|me',
        uuid: 'u1',
        name: 'Me',
        email: 'me@x.com',
        role: 'owner',
      },
    ]);
  });
});
