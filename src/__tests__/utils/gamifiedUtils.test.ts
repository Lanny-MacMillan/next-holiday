import {
  getGamifiedBackgroundColor,
  getGiftGamifiedBackgroundColor,
  getTaskGamifiedBackgroundColor,
} from '@/utils/gamifiedUtils';

const GRAY = 'bg-gradient-to-br from-gray-400 to-gray-600';

describe('getGamifiedBackgroundColor', () => {
  it.each([
    ['christmas', 'red'],
    ['hanukkah', 'blue'],
    ['halloween', 'orange'],
    ['thanksgiving', 'amber'],
    ['baby-shower', 'cyan'],
    ['graduation', 'purple'],
  ])('gives %s a %s gradient', (holiday, colour) => {
    expect(getGamifiedBackgroundColor(holiday)).toContain(`from-${colour}-`);
  });

  it('accepts both route names and display names, in any case', () => {
    expect(getGamifiedBackgroundColor('New Year')).toBe(
      getGamifiedBackgroundColor('new-year'),
    );
    expect(getGamifiedBackgroundColor("Valentine's Day")).toBe(
      getGamifiedBackgroundColor('valentines'),
    );
    expect(getGamifiedBackgroundColor('CHRISTMAS')).toBe(
      getGamifiedBackgroundColor('christmas'),
    );
  });

  it('falls back to gray for an unknown or missing holiday', () => {
    expect(getGamifiedBackgroundColor('arbor-day')).toBe(GRAY);
    expect(getGamifiedBackgroundColor()).toBe(GRAY);
  });
});

describe('getTaskGamifiedBackgroundColor', () => {
  it('colours by priority', () => {
    expect(getTaskGamifiedBackgroundColor('high')).toContain('red');
    expect(getTaskGamifiedBackgroundColor('medium')).toContain('yellow');
    expect(getTaskGamifiedBackgroundColor('low')).toContain('green');
    expect(getTaskGamifiedBackgroundColor('whenever')).toBe(GRAY);
  });
});

describe('getGiftGamifiedBackgroundColor', () => {
  it.each([
    [0, 'yellow'],
    [24.99, 'yellow'],
    [25, 'green'],
    [49.99, 'green'],
    [50, 'blue'],
    [99.99, 'blue'],
    [100, 'purple'],
    [5000, 'purple'],
  ])('a $%p gift is %s', (price, colour) => {
    expect(getGiftGamifiedBackgroundColor(price)).toContain(`from-${colour}-`);
  });
});
