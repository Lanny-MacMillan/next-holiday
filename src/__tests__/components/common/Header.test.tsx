/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import Header from '@/components/common/Header';

const logout = jest.fn();
const push = jest.fn();
let subscription = { isUserPlusMember: false, hasSubscription: true };

jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ logout }) }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => subscription,
}));
jest.mock('@/components/ThemeToggle', () => ({
  __esModule: true,
  default: () => <div>theme-toggle</div>,
}));
jest.mock('@/components/DisplayModeToggle', () => ({
  __esModule: true,
  default: () => <div>mode-toggle</div>,
}));
jest.mock('@/components/common/NotificationCenter', () => ({
  __esModule: true,
  default: () => <div>notifications</div>,
}));
jest.mock('@/components/common/UpgradeBanner', () => ({
  __esModule: true,
  default: () => <div>upgrade-banner</div>,
}));
jest.mock('@/components/modals/UpgradeModal', () => ({
  __esModule: true,
  default: ({
    isOpen,
    onClose,
    onUpgrade,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
  }) =>
    isOpen ? (
      <div>
        upgrade-modal
        <button onClick={onClose}>close-modal</button>
        <button onClick={onUpgrade}>finish-upgrade</button>
      </div>
    ) : null,
}));

const openMenu = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

beforeEach(() => {
  jest.clearAllMocks();
  subscription = { isUserPlusMember: false, hasSubscription: true };
  document.documentElement.classList.remove('dark');
});

describe('Header', () => {
  it('shows the app name linking home, notifications and the theme toggle', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Next Holiday' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByText('notifications')).toBeInTheDocument();
    expect(screen.getByText('theme-toggle')).toBeInTheDocument();
  });

  describe('for a Plus member', () => {
    beforeEach(() => {
      subscription = { isUserPlusMember: true, hasSubscription: true };
    });

    it('offers the display mode toggle and no upgrade banner', () => {
      render(<Header />);
      expect(screen.getByText('mode-toggle')).toBeInTheDocument();
      expect(screen.queryByText('upgrade-banner')).not.toBeInTheDocument();
    });

    it('has no upgrade item in the menu', () => {
      render(<Header />);
      openMenu();
      expect(screen.queryByText(/Upgrade Now/)).not.toBeInTheDocument();
    });
  });

  describe('for a free member', () => {
    it('shows the upgrade banner and no display mode toggle', () => {
      render(<Header />);
      expect(screen.getByText('upgrade-banner')).toBeInTheDocument();
      expect(screen.queryByText('mode-toggle')).not.toBeInTheDocument();
    });

    it('opens the upgrade modal from the menu, closing the menu', () => {
      render(<Header />);
      openMenu();
      fireEvent.click(screen.getByText(/Upgrade Now/));
      expect(screen.getByText('upgrade-modal')).toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('closes the modal when it asks to close or finishes the upgrade', () => {
      render(<Header />);
      openMenu();
      fireEvent.click(screen.getByText(/Upgrade Now/));
      fireEvent.click(screen.getByText('close-modal'));
      expect(screen.queryByText('upgrade-modal')).not.toBeInTheDocument();

      openMenu();
      fireEvent.click(screen.getByText(/Upgrade Now/));
      fireEvent.click(screen.getByText('finish-upgrade'));
      expect(screen.queryByText('upgrade-modal')).not.toBeInTheDocument();
    });
  });

  it('hides the upgrade item until the subscription is known', () => {
    subscription = { isUserPlusMember: false, hasSubscription: false };
    render(<Header />);
    openMenu();
    expect(screen.queryByText(/Upgrade Now/)).not.toBeInTheDocument();
  });

  describe('the menu', () => {
    it('opens and closes with the burger button', () => {
      render(<Header />);
      const button = screen.getByRole('button', { name: 'Open menu' });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Settings')).toBeInTheDocument();
      fireEvent.click(button);
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('closes when the page behind it is clicked', () => {
      const { container } = render(<Header />);
      openMenu();
      fireEvent.click(container.querySelector('.fixed.inset-0')!);
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it.each([
      ['Settings', '/settings'],
      ['Address Book', '/address-book'],
    ])('%s goes to %s and closes the menu', (label, path) => {
      render(<Header />);
      openMenu();
      fireEvent.click(screen.getByText(label));
      expect(push).toHaveBeenCalledWith(path);
      expect(screen.queryByText('Address Book')).not.toBeInTheDocument();
    });

    it('Logout signs out and returns to the site root', () => {
      render(<Header />);
      openMenu();
      fireEvent.click(screen.getByText('Logout'));
      expect(logout).toHaveBeenCalledWith({
        logoutParams: { returnTo: window.location.origin },
      });
    });
  });

  it('follows the dark class on the page for its background', async () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header') as HTMLElement;
    expect(header.style.backgroundColor).toBe('rgb(250, 245, 255)');
    await act(async () => {
      document.documentElement.classList.add('dark');
      await Promise.resolve();
    });
    expect(header.style.backgroundColor).toBe('rgb(10, 8, 15)');
  });

  it('stops watching the page when unmounted', () => {
    const disconnect = jest.spyOn(MutationObserver.prototype, 'disconnect');
    const { unmount } = render(<Header />);
    unmount();
    expect(disconnect).toHaveBeenCalled();
    disconnect.mockRestore();
  });
});
