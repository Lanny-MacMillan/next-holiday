import { render, screen } from '@testing-library/react';
import ProgressCard from '@/components/common/ProgressCard';

const useGetUserProgressQuery = jest.fn();
jest.mock('@/store/api', () => ({
  useGetUserProgressQuery: () => useGetUserProgressQuery(),
}));

const progress = (over = {}) => ({
  points: 60,
  levelInfo: { level: 2, pointsIntoLevel: 10, pointsForNext: 150, progress: 0.1 },
  streak: 3,
  holidaysCompleted: 1,
  badges: [
    {
      key: 'first_step',
      name: 'First Step',
      description: 'Complete your first item',
      earned: true,
      earnedAt: '2020-01-01T00:00:00.000Z',
      current: 1,
      target: 1,
    },
  ],
  ...over,
});

describe('ProgressCard', () => {
  it('renders nothing until the data arrives', () => {
    useGetUserProgressQuery.mockReturnValue({ data: undefined });
    const { container } = render(<ProgressCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows level, streak, holidays completed and badges', () => {
    useGetUserProgressQuery.mockReturnValue({ data: progress() });
    render(<ProgressCard />);
    expect(screen.getByText('Level 2, 60 pts')).toBeInTheDocument();
    expect(screen.getByText('140 pts to level 3')).toBeInTheDocument();
    expect(
      screen.getByText(/3-day streak, 1 holiday completed/),
    ).toBeInTheDocument();
    expect(screen.getByText('Badges (1 of 1)')).toBeInTheDocument();
  });

  it('handles a fresh account', () => {
    useGetUserProgressQuery.mockReturnValue({
      data: progress({ streak: 0, holidaysCompleted: 0, badges: [] }),
    });
    render(<ProgressCard />);
    expect(
      screen.getByText(/No streak yet, 0 holidays completed/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Badges/)).not.toBeInTheDocument();
  });
});
