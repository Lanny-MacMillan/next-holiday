import {
  transformCardPayload,
  transformGiftPayload,
  transformSuppliesPayload,
} from '../formTransformers';

const UUID = '3f2b8c1e-9a4d-4e6b-8c2f-1a2b3c4d5e6f';
const MEMBER_UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const members = [
  { userId: 'auth0|member', uuid: MEMBER_UUID },
  { userId: 'auth0|broken', uuid: 'not-a-uuid' },
];

describe('transformGiftPayload', () => {
  const contacts = [{ id: 'c1', name: 'Grace' }];

  it('maps the form fields to the API payload', () => {
    expect(
      transformGiftPayload(
        {
          name: 'Scarf',
          description: 'Wool',
          price: '19.5',
          store: 'Shop',
          product_link: 'http://x',
          notes: 'n',
          recipient: 'Grace',
        },
        contacts,
      ),
    ).toEqual({
      name: 'Scarf',
      description: 'Wool',
      price: 19.5,
      store: 'Shop',
      product_link: 'http://x',
      notes: 'n',
      contact_id: 'c1',
      recipient_name: 'Grace',
      recipient_email: null,
      recipient_phone: null,
      recipient_address: null,
      assigned_to: null,
    });
  });

  it('falls back through the alternative name fields and defaults the rest', () => {
    expect(transformGiftPayload({ giftName: 'Hat' }, []).name).toBe('Hat');
    expect(
      transformGiftPayload({ description: 'Only a description' }, []).name,
    ).toBe('Only a description');
    const empty = transformGiftPayload({}, []);
    expect(empty).toMatchObject({ name: '', price: 0, contact_id: null });
  });

  it('passes new-contact details through when the recipient is not a known contact', () => {
    const payload = transformGiftPayload(
      {
        name: 'x',
        recipient: 'New Person',
        email: 'n@x.com',
        phone: '555',
        address: '1 Main St',
      },
      contacts,
    );
    expect(payload).toMatchObject({
      contact_id: null,
      recipient_name: 'New Person',
      recipient_email: 'n@x.com',
      recipient_phone: '555',
      recipient_address: '1 Main St',
    });
  });

  describe('assignment', () => {
    it('keeps a valid UUID as is', () => {
      expect(
        transformGiftPayload({ assigned_to: UUID }, [], members).assigned_to,
      ).toBe(UUID);
      expect(transformGiftPayload({ assignedTo: UUID }, []).assigned_to).toBe(UUID);
    });

    it('swaps a member id for their UUID', () => {
      expect(
        transformGiftPayload({ assigned_to: 'auth0|member' }, [], members)
          .assigned_to,
      ).toBe(MEMBER_UUID);
    });

    it('drops an id it cannot resolve to a valid UUID', () => {
      expect(
        transformGiftPayload({ assigned_to: 'auth0|nobody' }, [], members)
          .assigned_to,
      ).toBeNull();
      expect(
        transformGiftPayload({ assigned_to: 'auth0|broken' }, [], members)
          .assigned_to,
      ).toBeNull();
    });

    it('drops a non-UUID when there are no members to look it up in', () => {
      expect(
        transformGiftPayload({ assigned_to: 'auth0|member' }, []).assigned_to,
      ).toBeNull();
    });
  });
});

describe('transformCardPayload', () => {
  const contacts = [
    {
      id: 'c1',
      name: 'Grace Hopper',
      streetAddress: '1 Navy Way',
      city: 'Arlington',
      state: 'VA',
      postalCode: '22202',
    },
    {
      id: 'c2',
      name: 'Ada',
      streetAddress: '2 Code Rd',
      city: 'London',
      zipCode: 'N1',
    },
  ];

  it('finds the contact case-insensitively and builds their address', () => {
    expect(transformCardPayload({ recipient: '  grace hopper ' }, contacts)).toEqual(
      {
        recipient: 'grace hopper',
        message: '',
        address: '1 Navy Way, Arlington, VA, 22202',
        contact_id: 'c1',
        assigned_to: null,
      },
    );
  });

  it('uses zipCode when there is no postalCode', () => {
    expect(transformCardPayload({ recipient: 'Ada' }, contacts).address).toBe(
      '2 Code Rd, London, N1',
    );
  });

  it('prefers an address typed into the form', () => {
    expect(
      transformCardPayload(
        { recipient: 'Grace Hopper', address: 'PO Box 9' },
        contacts,
      ).address,
    ).toBe('PO Box 9');
  });

  it('leaves the contact empty for a new recipient', () => {
    expect(
      transformCardPayload({ recipient: 'Someone New', message: ' Hi ' }, contacts),
    ).toMatchObject({
      contact_id: null,
      recipient: 'Someone New',
      message: 'Hi',
      address: '',
    });
  });

  it('handles an empty form', () => {
    expect(transformCardPayload({}, contacts)).toEqual({
      recipient: '',
      message: '',
      address: '',
      contact_id: null,
      assigned_to: null,
    });
  });

  it('resolves a member id to their UUID and drops one it cannot find', () => {
    expect(
      transformCardPayload({ assigned_to: 'auth0|member' }, [], members).assigned_to,
    ).toBe(MEMBER_UUID);
    expect(
      transformCardPayload({ assigned_to: 'auth0|nobody' }, [], members).assigned_to,
    ).toBeNull();
    expect(
      transformCardPayload({ assigned_to: UUID }, [], members).assigned_to,
    ).toBe(UUID);
  });
});

describe('transformSuppliesPayload', () => {
  it('maps the fields and accepts the alternative names', () => {
    expect(
      transformSuppliesPayload({
        item_name: 'Balloons',
        notes: 'blue',
        price: '4.25',
        link: 'http://b',
      }),
    ).toEqual({
      name: 'Balloons',
      description: 'blue',
      price: 4.25,
      store: '',
      product_link: 'http://b',
      notes: 'blue',
      assigned_to: null,
    });
  });

  it('only includes the actual price when one was given', () => {
    expect(transformSuppliesPayload({ name: 'x' })).not.toHaveProperty(
      'actual_price',
    );
    expect(
      transformSuppliesPayload({ name: 'x', actual_price: '' }),
    ).not.toHaveProperty('actual_price');
    expect(
      transformSuppliesPayload({ name: 'x', actual_price: '3.5' }).actual_price,
    ).toBe(3.5);
    expect(
      transformSuppliesPayload({ name: 'x', actual_price: 'abc' }).actual_price,
    ).toBe(0);
  });

  it('treats a bad price as zero', () => {
    expect(transformSuppliesPayload({ name: 'x', price: 'abc' }).price).toBe(0);
  });

  it('resolves a member id to their UUID', () => {
    expect(
      transformSuppliesPayload({ assigned_to: 'auth0|member' }, members).assigned_to,
    ).toBe(MEMBER_UUID);
  });
});
