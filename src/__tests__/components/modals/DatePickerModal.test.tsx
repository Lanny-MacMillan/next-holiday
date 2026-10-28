/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import DatePickerModal from '@/components/modals/DatePickerModal';

const handlers = () => ({
  onClose: jest.fn(),
  onDateSelect: jest.fn(),
  onDelete: jest.fn(),
});
const input = () =>
  document.querySelector('input[type="datetime-local"]') as HTMLInputElement;

describe('DatePickerModal', () => {
  it('renders nothing while closed', () => {
    render(<DatePickerModal isOpen={false} {...handlers()} />);
    expect(screen.queryByText('Set Countdown Date')).not.toBeInTheDocument();
  });

  it('starts empty with the submit button disabled', () => {
    render(<DatePickerModal isOpen {...handlers()} />);
    expect(input().value).toBe('');
    expect(screen.getByRole('button', { name: 'Set Countdown' })).toBeDisabled();
  });

  it('prefills from the default date', () => {
    render(
      <DatePickerModal isOpen {...handlers()} defaultDate="2030-12-25T09:15" />,
    );
    expect(input().value).toBe('2030-12-25T09:15');
  });

  it('prefers the current date over the default and offers Update and Delete', () => {
    render(
      <DatePickerModal
        isOpen
        {...handlers()}
        currentDate="2031-01-02T03:04"
        defaultDate="2030-12-25T09:15"
      />,
    );
    expect(input().value).toBe('2031-01-02T03:04');
    expect(
      screen.getByRole('button', { name: 'Update Countdown' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete Countdown' }),
    ).toBeInTheDocument();
  });

  it('labels the button Enable Countdown for an Enable title', () => {
    render(<DatePickerModal isOpen {...handlers()} title="Enable Countdown" />);
    expect(
      screen.getByRole('button', { name: 'Enable Countdown' }),
    ).toBeInTheDocument();
  });

  it('submits the picked date and closes', () => {
    const h = handlers();
    render(<DatePickerModal isOpen {...h} />);
    fireEvent.change(input(), { target: { value: '2032-02-03T04:05' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set Countdown' }));
    expect(h.onDateSelect).toHaveBeenCalledWith('2032-02-03T04:05');
    expect(h.onClose).toHaveBeenCalledTimes(1);
  });

  it('Cancel and × close without selecting', () => {
    const h = handlers();
    render(<DatePickerModal isOpen {...h} defaultDate="2030-12-25T09:15" />);
    fireEvent.change(input(), { target: { value: '2032-02-03T04:05' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(h.onClose).toHaveBeenCalledTimes(2);
    expect(h.onDateSelect).not.toHaveBeenCalled();
    expect(input().value).toBe('2030-12-25T09:15');
  });

  it('Delete calls onDelete and closes', () => {
    const h = handlers();
    render(<DatePickerModal isOpen {...h} currentDate="2031-01-02T03:04" />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Countdown' }));
    expect(h.onDelete).toHaveBeenCalledTimes(1);
    expect(h.onClose).toHaveBeenCalledTimes(1);
  });

  it('hides Delete when there is no onDelete handler', () => {
    render(
      <DatePickerModal
        isOpen
        onClose={jest.fn()}
        onDateSelect={jest.fn()}
        currentDate="2031-01-02T03:04"
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Delete Countdown' }),
    ).not.toBeInTheDocument();
  });

  it('resets to the new current date when it changes', () => {
    const h = handlers();
    const { rerender } = render(
      <DatePickerModal isOpen {...h} currentDate="2031-01-02T03:04" />,
    );
    rerender(<DatePickerModal isOpen {...h} currentDate="2033-05-06T07:08" />);
    expect(input().value).toBe('2033-05-06T07:08');
  });
});
