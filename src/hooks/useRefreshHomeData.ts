import { useAppDispatch } from '@/store/hooks';
import { setHomeData } from '@/store/slices/homeSlice';

export function useRefreshHomeData() {
  const dispatch = useAppDispatch();

  const refreshHomeData = async (auth0User: any, holidayId?: string | null) => {
    if (!auth0User?.sub) return;

    try {
      const response = await fetch('/api/home', {
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
      });
      if (response.ok) {
        const result = await response.json();
        dispatch(setHomeData(result.data)); // Refresh entire Redux state
      }
    } catch (error) {
      console.error('Error refreshing home data:', error);
    }
  };

  return { refreshHomeData };
}
