/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import SortModal from '@/components/modals/SortModal';

const options = [
  { value: 'none', label: 'None' },
  { value: 'store', label: 'Store' },
];

const renderModal = (over: Record<string, any> = {}) => {
  const props = {
    isOpen: true,
    onClose: jest.fn(),
    sortBy: 'none',
    onSortChange: jest.fn(),
    sortOptions: options,
    title: 'Sort Gifts',
    ...over,
  };
  render(<SortModal {...props} />);
  return props;
};

describe('SortModal', () => {
  it('renders nothing while closed', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText('Sort Gifts')).toBeNull();
  });

  it('lists the options under the title and marks the current one', () => {
    renderModal({ sortBy: 'store' });

    expect(screen.getByText('Sort Gifts')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Store' }).className).toContain(
      'bg-yellow-500',
    );
    expect(screen.getByRole('button', { name: 'None' }).className).not.toContain(
      'bg-yellow-500',
    );
  });

  it('picks an option and closes', () => {
    const { onSortChange, onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Store' }));

    expect(onSortChange).toHaveBeenCalledWith('store');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes with the x without changing the sort', () => {
    const { onSortChange, onClose } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: '×' }));

    expect(onClose).toHaveBeenCalled();
    expect(onSortChange).not.toHaveBeenCalled();
  });
});
