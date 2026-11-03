import { act, render, screen } from '@testing-library/react';
import BadgeEarnedNotice from '@/components/common/BadgeEarnedNotice';

const useGetUserProgressQuery = jest.fn();
jest.mock('@/store/api', () => ({
  useGetUserProgressQuery: () => useGetUserProgressQuery(),
}));

const progress = (earned: boolean) => ({
  points: 0,
  levelInfo: { level: 1, pointsIntoLevel: 0, pointsForNext: 50, progress: 0 },
  streak: 0,
  holidaysCompleted: 0,
  badges: [
    {
      key: 'first_step',
      name: 'First Step',
      description: '',
      earned,
      earnedAt: null,
      current: 0,
      target: 1,
    },
  ],
});

describe('BadgeEarnedNotice', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('stays quiet on the first load, even for badges already earned', () => {
    useGetUserProgressQuery.mockReturnValue({ data: progress(true) });
    render(<BadgeEarnedNotice />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('announces a badge that appears later, then goes away', () => {
    useGetUserProgressQuery.mockReturnValue({ data: progress(false) });
    const { rerender } = render(<BadgeEarnedNotice />);

    useGetUserProgressQuery.mockReturnValue({ data: progress(true) });
    rerender(<BadgeEarnedNotice />);
    expect(screen.getByRole('status')).toHaveTextContent('Badge earned: First Step');

    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
