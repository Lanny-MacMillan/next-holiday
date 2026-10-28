/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { clearHomeData, setHomeData } from '@/store/slices/homeSlice';
import { useFormModalMutation } from '@/hooks/useFormModalMutation';

let authValue: { user?: { sub: string; email?: string } };
let currentPath = '/christmas/gift-list';
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));
jest.mock('next/navigation', () => ({ usePathname: () => currentPath }));

const mockFetch = jest.fn();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);
const signedIn = { sub: 'auth0|me', email: 'me@x.com' };

beforeEach(() => {
  jest.clearAllMocks();
  authValue = { user: signedIn };
  currentPath = '/christmas/gift-list';
  global.fetch = mockFetch as unknown as typeof fetch;
  act(() => {
    store.dispatch(clearHomeData());
  });
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

const renderTheHook = () => renderHook(() => useFormModalMutation(), { wrapper });

describe('useFormModalMutation', () => {
  describe('the database user id', () => {
    it('looks the signed-in user up by their Auth0 id and adds the database id', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'db-uuid-1' }),
      });
      const { result } = renderTheHook();

      await waitFor(() =>
        expect(result.current.auth0User).toMatchObject({ id: 'db-uuid-1' }),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users/by-auth0-sub?sub=auth0%7Cme',
      );
      expect(result.current.auth0User).toMatchObject(signedIn);
    });

    it('falls back to the plain Auth0 user when the lookup fails', async () => {
      mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
      const { result } = renderTheHook();

      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      expect(result.current.auth0User).toEqual(signedIn);
    });

    it('falls back to the plain Auth0 user when the request errors', async () => {
      mockFetch.mockRejectedValue(new Error('offline'));
      const { result } = renderTheHook();

      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      expect(result.current.auth0User).toEqual(signedIn);
    });

    it('makes no request when nobody is signed in', () => {
      authValue = {};
      const { result } = renderTheHook();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.auth0User).toBeUndefined();
    });

    it('asks once per signed-in user, not on every render', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'db-uuid-1' }),
      });
      const { result, rerender } = renderTheHook();
      await waitFor(() =>
        expect(result.current.auth0User).toMatchObject({ id: 'db-uuid-1' }),
      );
      rerender();
      rerender();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('the holiday it is on', () => {
    const loadHome = () =>
      act(() => {
        store.dispatch(
          setHomeData({
            holidayPreferences: [{ holiday: 'Christmas', holidayId: 'h-christmas' }],
          } as never),
        );
      });

    beforeEach(() =>
      mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) }),
    );

    it('has no holiday until the home data has loaded', () => {
      const { result } = renderTheHook();
      expect(result.current.holidayId).toBeNull();
    });

    it("works out the holiday's id from the page once the home data is there", () => {
      loadHome();
      const { result } = renderTheHook();
      expect(result.current.holidayId).toBe('h-christmas');
    });

    it('has no holiday on a page that is not a holiday', () => {
      loadHome();
      currentPath = '/settings';
      const { result } = renderTheHook();
      expect(result.current.holidayId).toBeNull();
    });

    it('offers the card mutations', () => {
      const { result } = renderTheHook();
      expect(typeof result.current.updateCard).toBe('function');
      expect(typeof result.current.editCard).toBe('function');
      expect(typeof result.current.deleteCard).toBe('function');
    });
  });
});
