/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import SharedUserList from '@/components/common/SharedUserList';

const member = (n: number, over: Record<string, any> = {}): any => ({
  userId: `u${n}`,
  uuid: `uuid-${n}`,
  name: `Person ${n}`,
  email: `p${n}@x.com`,
  ...over,
});
const members = (count: number) =>
  Array.from({ length: count }, (_, i) => member(i + 1));

describe('SharedUserList', () => {
  it('shows nothing when nobody is sharing', () => {
    const { container } = render(<SharedUserList members={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('shows an avatar for each member when they all fit', () => {
    render(<SharedUserList members={members(3)} />);

    expect(screen.getAllByText(/^P\d$/).length).toBe(3);
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it('shows how many more there are beyond the visible limit', () => {
    render(<SharedUserList members={members(7)} maxVisible={5} />);

    expect(screen.getByRole('button', { name: '+2' })).toBeTruthy();
  });

  it('can show the shared icon', () => {
    const { container } = render(
      <SharedUserList members={members(2)} showSharedIcon />,
    );

    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('lists everyone, with email and join date, in its own dialog', () => {
    render(
      <SharedUserList
        members={[
          ...members(5),
          member(6, { joinedAt: '2030-03-04T12:00:00Z' }),
          { userId: 'u7', uuid: 'uuid-7' } as any,
        ]}
        maxVisible={5}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '+2' }));

    expect(screen.getByText('Shared Members (7)')).toBeTruthy();
    expect(screen.getByText('p6@x.com')).toBeTruthy();
    expect(screen.getByText(/Joined/)).toBeTruthy();
    expect(screen.getByText('Unknown User')).toBeTruthy();
  });

  it('closes the dialog from the x button or by clicking outside it', () => {
    render(<SharedUserList members={members(7)} maxVisible={5} />);

    fireEvent.click(screen.getByRole('button', { name: '+2' }));
    fireEvent.click(screen.getByText('Shared Members (7)'));
    expect(screen.getByText('Shared Members (7)')).toBeTruthy();

    fireEvent.click(
      screen.getAllByRole('button').find(b => b.querySelector('path'))!,
    );
    expect(screen.queryByText('Shared Members (7)')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '+2' }));
    fireEvent.click(screen.getByText('Shared Members (7)').closest('.fixed')!);
    expect(screen.queryByText('Shared Members (7)')).toBeNull();
  });

  it('hands over to the parent when it wants to show the list itself', () => {
    const onOpenModal = jest.fn();
    render(
      <SharedUserList
        members={members(7)}
        maxVisible={5}
        onOpenModal={onOpenModal}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '+2' }));

    expect(onOpenModal).toHaveBeenCalled();
    expect(screen.queryByText('Shared Members (7)')).toBeNull();
  });

  it.each([
    ['xs', 'w-4'],
    ['sm', 'w-6'],
    ['md', 'w-8'],
    ['lg', 'w-10'],
  ] as const)('sizes the +N button for %s avatars', (size, cls) => {
    render(<SharedUserList members={members(6)} maxVisible={5} size={size} />);

    expect(screen.getByRole('button', { name: '+1' }).className).toContain(cls);
  });
});
