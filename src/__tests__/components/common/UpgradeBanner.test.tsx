/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import UpgradeBanner from '@/components/common/UpgradeBanner';

let subscription: Record<string, any>;
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => subscription,
}));
const modal = jest.fn();
jest.mock('@/components/modals/UpgradeModal', () => ({
  __esModule: true,
  default: (props: any) => {
    modal(props);
    return props.isOpen ? (
      <div role="dialog" aria-label="upgrade">
        <button onClick={props.onUpgrade}>complete upgrade</button>
        <button onClick={props.onClose}>close modal</button>
      </div>
    ) : null;
  },
}));

beforeEach(() => {
  modal.mockClear();
  document.documentElement.classList.remove('dark');
  subscription = {
    hasSubscription: true,
    isUserPlusMember: false,
    initialized: true,
    loading: false,
  };
});

describe('UpgradeBanner', () => {
  it('offers Plus to a free user', () => {
    render(<UpgradeBanner />);

    expect(screen.getByText('Upgrade to Plus')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Upgrade Now/ })).toBeTruthy();
  });

  it.each([
    ['while the user is still loading', { loading: true }],
    ['before the user data is ready', { initialized: false }],
    ['when there is no subscription data', { hasSubscription: false }],
    ['to someone who already has Plus', { isUserPlusMember: true }],
  ])('stays hidden %s', (_label, over) => {
    subscription = { ...subscription, ...over };
    render(<UpgradeBanner />);

    expect(screen.queryByText('Upgrade to Plus')).toBeNull();
  });

  it('can be dismissed', () => {
    render(<UpgradeBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Close upgrade banner' }));

    expect(screen.queryByText('Upgrade to Plus')).toBeNull();
  });

  it('opens the upgrade dialog and closes it again', () => {
    render(<UpgradeBanner />);

    fireEvent.click(screen.getByRole('button', { name: /Upgrade Now/ }));
    expect(screen.getByRole('dialog', { name: 'upgrade' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'close modal' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes the dialog once the upgrade is done', () => {
    render(<UpgradeBanner />);

    fireEvent.click(screen.getByRole('button', { name: /Upgrade Now/ }));
    fireEvent.click(screen.getByRole('button', { name: 'complete upgrade' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps working when the theme changes and stops watching it when removed', async () => {
    const disconnect = jest.spyOn(MutationObserver.prototype, 'disconnect');
    const { unmount } = render(<UpgradeBanner />);

    await act(async () => {
      document.documentElement.classList.add('dark');
    });
    expect(screen.getByText('Upgrade to Plus')).toBeTruthy();

    unmount();
    expect(disconnect).toHaveBeenCalled();
    disconnect.mockRestore();
  });
});
