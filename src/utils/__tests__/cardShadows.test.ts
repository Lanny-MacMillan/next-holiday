import { getCardStyling } from '../cardShadows';

describe('getCardStyling', () => {
  it('gives a plain light-mode card just a dark drop shadow', () => {
    const style = getCardStyling();
    expect(Object.keys(style)).toEqual(['filter']);
    expect(style.filter).toContain('rgba(0, 0, 0');
  });

  it('uses a light shadow in dark mode', () => {
    expect(getCardStyling({ isDarkMode: true }).filter).toContain(
      'rgba(255, 255, 255',
    );
  });

  it('makes heavier shadows stronger', () => {
    const alpha = (intensity: 'light' | 'medium' | 'heavy') =>
      Number(
        /rgba\(0, 0, 0, ([\d.]+)\)/.exec(
          getCardStyling({ intensity }).filter as string,
        )![1],
      );
    expect(alpha('light')).toBeLessThan(alpha('medium'));
    expect(alpha('medium')).toBeLessThan(alpha('heavy'));
  });

  it('makes a heavy gamified shadow darker than a heavy plain one', () => {
    const alpha = (isGamified: boolean) =>
      Number(
        /rgba\(0, 0, 0, ([\d.]+)\)/.exec(
          getCardStyling({ intensity: 'heavy', isGamified }).filter as string,
        )![1],
      );
    expect(alpha(true)).toBeGreaterThan(alpha(false));
  });

  it('gives gamified cards a white border on every side, in either mode', () => {
    for (const isDarkMode of [false, true]) {
      const style = getCardStyling({ isGamified: true, isDarkMode });
      expect(style).toMatchObject({
        borderTopWidth: '2px',
        borderLeftWidth: '2px',
        borderTopColor: 'white',
        borderBottomColor: 'white',
        borderLeftStyle: 'solid',
      });
    }
  });

  it('outlines dark-mode cards, more strongly at heavier intensity', () => {
    const width = (intensity: 'light' | 'medium' | 'heavy') =>
      getCardStyling({ isDarkMode: true, intensity }).borderTopWidth;
    expect(width('light')).toBe('1px');
    expect(width('medium')).toBe('1px');
    expect(width('heavy')).toBe('3px');
    expect(
      getCardStyling({ isDarkMode: true, intensity: 'light' }).borderTopColor,
    ).toBe('rgba(255, 255, 255, 0.1)');
  });
});
