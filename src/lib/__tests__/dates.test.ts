import { dateOnlyToUTC, toDateOnlyString } from '../dates';

describe('dates', () => {
  it('reads a date-only string as midnight UTC', () => {
    expect(dateOnlyToUTC('2024-12-25').toISOString()).toBe(
      '2024-12-25T00:00:00.000Z',
    );
  });

  it('writes a date back as date-only', () => {
    expect(toDateOnlyString(new Date('2024-12-25T18:30:00.000Z'))).toBe(
      '2024-12-25',
    );
  });

  it('round-trips', () => {
    expect(toDateOnlyString(dateOnlyToUTC('2025-02-14'))).toBe('2025-02-14');
  });

  it('returns null for no date', () => {
    expect(toDateOnlyString(null)).toBeNull();
  });
});
