import { combineReducers, configureStore } from '@reduxjs/toolkit';
import addressBookReducer, {
  addContact,
  deleteContact,
  fetchContacts,
  resetContacts,
  updateContact,
  type Contact,
} from '@/store/slices/addressBookSlice';

const mockFetch = jest.fn();
const contact = (over: Partial<Contact> = {}): Contact => ({
  id: 'c1',
  name: 'Ada',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...over,
});
const makeStore = (contacts: Contact[] = [], homeContacts?: unknown[]) => {
  const home = { data: homeContacts ? { contacts: homeContacts } : null };
  return configureStore({
    reducer: {
      addressBook: addressBookReducer,
      home: (state: unknown = home) => state,
    } as never,
    preloadedState: {
      addressBook: {
        contacts,
        loading: false,
        error: null,
        selectedContact: null,
        initialized: false,
      },
    } as never,
  }) as unknown as ReturnType<
    typeof configureStore<{ addressBook: ReturnType<typeof addressBookReducer> }>
  >;
};
const reply = (body: unknown, ok = true) => ({ ok, json: async () => body });
const user = { sub: 's', email: 'e', name: 'n', picture: 'x' };

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe('fetchContacts', () => {
  it('copies contacts from the home data, turning Dates into strings', async () => {
    const created = new Date('2024-02-03T04:05:06Z');
    const store = makeStore(
      [],
      [contact({ id: 'h1', createdAt: created, updatedAt: '2024-05-05' })],
    );
    await store.dispatch(fetchContacts());

    const state = store.getState().addressBook;
    expect(state.contacts).toEqual([
      contact({
        id: 'h1',
        createdAt: created.toISOString(),
        updatedAt: '2024-05-05',
      }),
    ]);
    expect(state).toMatchObject({ initialized: true, loading: false });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('replaces whatever was there rather than merging', async () => {
    const store = makeStore([contact({ id: 'old' })], [contact({ id: 'new' })]);
    await store.dispatch(fetchContacts());
    expect(store.getState().addressBook.contacts.map(c => c.id)).toEqual(['new']);
  });

  it('ends up empty and initialized when there is no home data', async () => {
    const store = makeStore([contact()]);
    await store.dispatch(fetchContacts());
    expect(store.getState().addressBook).toMatchObject({
      contacts: [],
      initialized: true,
    });
  });
});

describe('addContact', () => {
  it('posts the contact, sending postalCode as zipCode, and appends the result', async () => {
    mockFetch.mockResolvedValue(reply({ data: contact({ id: 'new' }) }));
    const store = makeStore();
    await store.dispatch(addContact({ name: 'Ada', postalCode: '90210' }));

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/contacts');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      name: 'Ada',
      postalCode: '90210',
      zipCode: '90210',
    });
    expect(store.getState().addressBook.contacts.map(c => c.id)).toEqual(['new']);
  });

  it('accepts a bare contact as well as a data envelope', async () => {
    mockFetch.mockResolvedValue(reply(contact({ id: 'bare' })));
    const store = makeStore();
    await store.dispatch(addContact({ name: 'Ada' }));
    expect(store.getState().addressBook.contacts[0].id).toBe('bare');
  });

  it('adds the test-user header only when given a user', async () => {
    mockFetch.mockResolvedValue(reply({ data: contact() }));
    await makeStore().dispatch(addContact({ name: 'A', auth0User: user }));
    expect(JSON.parse(mockFetch.mock.calls[0][1].headers['x-test-user'])).toEqual({
      sub: 's',
      email: 'e',
      name: 'n',
    });
    await makeStore().dispatch(addContact({ name: 'A' }));
    expect(mockFetch.mock.calls[1][1].headers['x-test-user']).toBeUndefined();
  });

  it('records the error, with a fallback message', async () => {
    mockFetch.mockResolvedValueOnce(reply({ error: 'Name required' }, false));
    const a = makeStore();
    await a.dispatch(addContact({ name: '' }));
    expect(a.getState().addressBook.error).toBe('Name required');

    mockFetch.mockResolvedValueOnce(reply({}, false));
    const b = makeStore();
    await b.dispatch(addContact({ name: '' }));
    expect(b.getState().addressBook.error).toBe('Failed to add contact');
  });
});

describe('updateContact', () => {
  it('puts to the contact and replaces it in the list', async () => {
    mockFetch.mockResolvedValue(reply({ data: contact({ name: 'Grace' }) }));
    const store = makeStore([contact(), contact({ id: 'c2' })]);
    await store.dispatch(updateContact(contact({ name: 'Grace', postalCode: '1' })));

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/contacts/c1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body).zipCode).toBe('1');
    expect(store.getState().addressBook.contacts.map(c => c.name)).toEqual([
      'Grace',
      'Ada',
    ]);
  });

  it('ignores a response for a contact it does not hold', async () => {
    mockFetch.mockResolvedValue(reply({ data: contact({ id: 'ghost' }) }));
    const store = makeStore([contact()]);
    await store.dispatch(updateContact(contact({ id: 'ghost' })));
    expect(store.getState().addressBook.contacts).toEqual([contact()]);
  });

  it('records the error, with a fallback message', async () => {
    mockFetch.mockResolvedValueOnce(reply({ error: 'Not yours' }, false));
    const a = makeStore([contact()]);
    await a.dispatch(updateContact(contact({ auth0User: user } as never)));
    expect(a.getState().addressBook.error).toBe('Not yours');
    expect(JSON.parse(mockFetch.mock.calls[0][1].headers['x-test-user']).sub).toBe(
      's',
    );

    mockFetch.mockResolvedValueOnce(reply({}, false));
    const b = makeStore([contact()]);
    await b.dispatch(updateContact(contact()));
    expect(b.getState().addressBook.error).toBe('Failed to update contact');
  });
});

describe('deleteContact', () => {
  it('deletes the contact and removes it from the list', async () => {
    mockFetch.mockResolvedValue(reply({}));
    const store = makeStore([contact(), contact({ id: 'c2' })]);
    await store.dispatch(deleteContact({ contactId: 'c1', auth0User: user }));

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/contacts/c1');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.headers['x-test-user']).sub).toBe('s');
    expect(store.getState().addressBook.contacts.map(c => c.id)).toEqual(['c2']);
  });

  it('records the error and keeps the contact', async () => {
    mockFetch.mockResolvedValueOnce(reply({ error: 'In use' }, false));
    const a = makeStore([contact()]);
    await a.dispatch(deleteContact({ contactId: 'c1' }));
    expect(a.getState().addressBook).toMatchObject({ error: 'In use' });
    expect(a.getState().addressBook.contacts).toHaveLength(1);

    mockFetch.mockResolvedValueOnce(reply({}, false));
    const b = makeStore([contact()]);
    await b.dispatch(deleteContact({ contactId: 'c1' }));
    expect(b.getState().addressBook.error).toBe('Failed to delete contact');
  });
});

it('resetContacts empties the list and marks it uninitialized', () => {
  const state = addressBookReducer(
    {
      contacts: [contact()],
      loading: false,
      error: null,
      selectedContact: null,
      initialized: true,
    },
    resetContacts(),
  );
  expect(state).toMatchObject({ contacts: [], initialized: false });
});
