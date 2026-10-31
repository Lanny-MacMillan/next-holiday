/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import FormModal, { FormModalProps } from '@/components/modals/FormModal';
import type { FormField } from '@/types/form';

const giftFields: FormField[] = [
  {
    id: 'recipient',
    type: 'text',
    placeholder: 'Recipient',
    required: true,
    showAddressBook: true,
  },
  { id: 'name', type: 'text', placeholder: 'Gift name', required: true },
  { id: 'price', type: 'number', placeholder: 'Price', required: true },
  { id: 'email', type: 'email', placeholder: 'Email' },
  { id: 'notes', type: 'textarea', placeholder: 'Notes' },
  {
    id: 'store',
    type: 'select',
    placeholder: 'Store',
    options: [{ value: 'a', label: 'Shop A' }],
  },
  { id: 'due', type: 'date', placeholder: 'Due' },
  { id: 'link', type: 'url', placeholder: 'Link' },
  { id: 'done', type: 'checkbox', label: 'Done' },
];

const setup = (over: Partial<FormModalProps> = {}) => {
  const props: FormModalProps = {
    isOpen: true,
    title: 'Add Gift',
    fields: giftFields,
    onSubmit: jest.fn(),
    onClose: jest.fn(),
    ...over,
  };
  const utils = render(<FormModal {...props} />);
  return { props, ...utils };
};
const type = (placeholder: string, value: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
const submit = () => fireEvent.submit(document.querySelector('form')!);

beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('FormModal', () => {
  it('renders nothing while closed', () => {
    setup({ isOpen: false });
    expect(screen.queryByText('Add Gift')).not.toBeInTheDocument();
  });

  it('renders the title and every field type', () => {
    setup();
    expect(screen.getByText('Add Gift')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Notes').tagName).toBe('TEXTAREA');
    expect(screen.getByPlaceholderText('Store').tagName).toBe('SELECT');
    expect(screen.getByPlaceholderText('Price')).toHaveAttribute('type', 'number');
    expect(screen.getByPlaceholderText('Due')).toHaveAttribute('type', 'date');
    expect(screen.getByPlaceholderText('Link')).toHaveAttribute('type', 'url');
    expect(screen.getByLabelText('Done')).toHaveAttribute('type', 'checkbox');
  });

  it('uses custom button text and shows Processing... while loading', () => {
    const { rerender, props } = setup({ submitText: 'Save', cancelText: 'Nope' });
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Nope' })).toBeInTheDocument();
    rerender(<FormModal {...props} loading />);
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
  });

  it('fills the form from initialValues when it opens', () => {
    setup({
      initialValues: {
        recipient: 'Ada',
        price: 12,
        due: '2030-05-06T00:00:00.000Z',
      },
    });
    expect(screen.getByPlaceholderText('Recipient')).toHaveValue('Ada');
    expect(screen.getByPlaceholderText('Price')).toHaveValue(12);
    expect(screen.getByPlaceholderText('Due')).toHaveValue('2030-05-06');
  });

  it('submits the typed values, with numbers parsed', () => {
    const { props } = setup();
    type('Recipient', 'Ada');
    type('Gift name', 'Book');
    type('Price', '19.5');
    fireEvent.click(screen.getByLabelText('Done'));
    submit();
    expect(props.onSubmit).toHaveBeenCalledWith({
      recipient: 'Ada',
      name: 'Book',
      price: 19.5,
      done: true,
    });
  });

  it('ignores non-numeric text in a number field', () => {
    setup();
    type('Price', 'abc');
    expect(screen.getByPlaceholderText('Price')).toHaveValue(null);
  });

  it('blocks submit and names the missing required fields', () => {
    const { props } = setup();
    type('Recipient', 'Ada');
    submit();
    expect(window.alert).toHaveBeenCalledWith(
      'Please fill in all required fields: Gift name, Price',
    );
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('counts whitespace as empty', () => {
    const { props } = setup({
      fields: [{ id: 'name', type: 'text', required: true }],
    });
    fireEvent.change(document.querySelector('input')!, { target: { value: '   ' } });
    submit();
    expect(window.alert).toHaveBeenCalledWith(
      'Please fill in all required fields: name',
    );
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a malformed email but lets an empty one through', () => {
    const { props } = setup({
      initialValues: { recipient: 'Ada', name: 'Book', price: 5 },
    });
    type('Email', 'not-an-email');
    submit();
    expect(window.alert).toHaveBeenCalledWith(
      'Please enter valid email addresses for: Email',
    );
    expect(props.onSubmit).not.toHaveBeenCalled();

    type('Email', '');
    submit();
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('Cancel and × both close', () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  describe('assignee options', () => {
    const fields: FormField[] = [
      { id: 'assigned_to', type: 'select', placeholder: 'Assignee' },
    ];

    it('lists share members by uuid and drops those without one', () => {
      setup({
        fields,
        shareMembers: [
          { uuid: 'u-1', name: 'Ada', email: 'a@x.com' },
          { uuid: 'u-2', email: 'b@x.com' },
          { uuid: '', name: 'No uuid' },
        ] as never,
      });
      const labels = Array.from(
        screen.getByPlaceholderText('Assignee').querySelectorAll('option'),
      ).map(o => [o.value, o.textContent]);
      expect(labels).toEqual([
        ['', 'Unassigned'],
        ['u-1', 'Ada'],
        ['u-2', 'b@x.com'],
      ]);
    });

    it('leaves the field alone when there are no members', () => {
      setup({ fields });
      expect(
        screen.getByPlaceholderText('Assignee').querySelectorAll('option'),
      ).toHaveLength(0);
    });
  });

  describe('address book', () => {
    const contacts = [
      {
        id: 'c1',
        name: 'Grace',
        email: 'g@x.com',
        phone: '555',
        streetAddress: '1 Main',
        city: 'Town',
        state: 'TX',
        postalCode: '75001',
      },
      { id: 'c2', name: 'Alan' },
    ];
    const open = () =>
      fireEvent.click(screen.getByRole('button', { name: 'Address book' }));

    it('shows contacts, or an empty hint', () => {
      const { unmount } = setup({ contacts });
      open();
      expect(
        screen.getByText('From Address Book (2 contacts):'),
      ).toBeInTheDocument();
      expect(screen.getByText('1 Main, Town, TX 75001')).toBeInTheDocument();
      unmount();

      setup();
      open();
      expect(screen.getByText(/No contacts available/)).toBeInTheDocument();
    });

    it('toggles the list with the book button', () => {
      setup({ contacts });
      open();
      open();
      expect(screen.queryByText(/From Address Book/)).not.toBeInTheDocument();
    });

    it('picking a contact on a gift form fills the recipient, email, phone and address', () => {
      const { props } = setup({
        contacts,
        fields: [
          ...giftFields,
          { id: 'address', type: 'text', placeholder: 'Address' },
          { id: 'phone', type: 'tel', placeholder: 'Phone' },
        ],
      });
      open();
      fireEvent.click(screen.getByText('Grace'));

      expect(screen.getByPlaceholderText('Recipient')).toHaveValue('Grace');
      expect(screen.getByPlaceholderText('Email')).toHaveValue('g@x.com');
      expect(screen.getByPlaceholderText('Phone')).toHaveValue('555');
      expect(screen.getByPlaceholderText('Address')).toHaveValue(
        '1 Main, Town, TX, 75001',
      );
      expect(screen.queryByText(/From Address Book/)).not.toBeInTheDocument();
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it('picking a contact on a guest form (name, no recipient) fills the name', () => {
      setup({
        contacts,
        fields: [
          { id: 'name', type: 'text', placeholder: 'Guest', showAddressBook: true },
        ],
      });
      open();
      fireEvent.click(screen.getByText('Alan'));
      expect(screen.getByPlaceholderText('Guest')).toHaveValue('Alan');
    });

    it('picking a contact on a recipient-only form fills the recipient', () => {
      setup({
        contacts,
        fields: [
          {
            id: 'recipient',
            type: 'text',
            placeholder: 'To',
            showAddressBook: true,
          },
        ],
      });
      open();
      fireEvent.click(screen.getByText('Alan'));
      expect(screen.getByPlaceholderText('To')).toHaveValue('Alan');
    });

    it('tells the user a typed guest is added to the address book, and hides that when cleared', () => {
      setup({ contacts });
      type('Recipient', 'New Person');
      expect(
        screen.getByText(/automatically added to your address book/),
      ).toBeInTheDocument();
      type('Recipient', ' ');
      expect(screen.queryByText(/automatically added/)).not.toBeInTheDocument();
    });
  });
});
