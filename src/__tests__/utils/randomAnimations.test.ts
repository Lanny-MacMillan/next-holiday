/**
 * @jest-environment jsdom
 */
import {
  cleanupOldAnimations,
  generateRandomBouncingAnimation,
} from '@/utils/randomAnimations';

const styleEl = () =>
  document.getElementById('random-animations-style') as HTMLStyleElement | null;

afterEach(() => {
  styleEl()?.remove();
  jest.restoreAllMocks();
});

describe('generateRandomBouncingAnimation', () => {
  it('gives each shape its own animation name', () => {
    const names = new Set(
      Array.from(
        { length: 20 },
        () => generateRandomBouncingAnimation().animationName,
      ),
    );
    expect(names.size).toBe(20);
  });

  it('keeps the timing gentle', () => {
    for (let i = 0; i < 50; i++) {
      const { duration, delay, timingFunction } = generateRandomBouncingAnimation();
      expect(duration).toBeGreaterThanOrEqual(3.5);
      expect(duration).toBeLessThanOrEqual(6);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(2);
      expect(['ease-in-out', 'ease', 'ease-out']).toContain(timingFunction);
    }
  });

  it('adds nothing to the page until its keyframes are set up', () => {
    generateRandomBouncingAnimation();
    expect(styleEl()).toBeNull();
  });

  it('injects keyframes that start and end at the base scale', () => {
    const anim = generateRandomBouncingAnimation(1.5);
    anim.setupKeyframes();

    const css =
      styleEl()!.textContent +
      Array.from(styleEl()!.sheet?.cssRules ?? [])
        .map(r => r.cssText)
        .join('');
    expect(css).toContain(anim.animationName);
    expect(css).toContain('scale(1.5)');
  });

  it('reuses one style element for every animation', () => {
    generateRandomBouncingAnimation().setupKeyframes();
    generateRandomBouncingAnimation().setupKeyframes();
    expect(document.querySelectorAll('#random-animations-style')).toHaveLength(1);
  });

  it('falls back to text when the rule is rejected', () => {
    generateRandomBouncingAnimation().setupKeyframes();
    jest.spyOn(CSSStyleSheet.prototype, 'insertRule').mockImplementation(() => {
      throw new Error('bad rule');
    });
    const anim = generateRandomBouncingAnimation();
    anim.setupKeyframes();
    expect(styleEl()!.textContent).toContain(anim.animationName);
  });
});

describe('cleanupOldAnimations', () => {
  it('does nothing when there is no style element', () => {
    expect(() => cleanupOldAnimations()).not.toThrow();
  });

  const overfill = () => {
    generateRandomBouncingAnimation().setupKeyframes();
    const sheet = styleEl()!.sheet!;
    for (let i = 0; i < 120; i++)
      sheet.insertRule(`.r${i} { color: red; }`, sheet.cssRules.length);
    return sheet;
  };

  it('removes the oldest rules when there are more than 100', () => {
    const sheet = overfill();
    const before = sheet.cssRules.length;
    cleanupOldAnimations();
    expect(sheet.cssRules.length).toBeLessThan(before);
    expect(Array.from(sheet.cssRules).some(r => r.cssText.includes('.r119'))).toBe(
      true,
    );
  });

  // KNOWN ISSUE: the loop re-reads the live cssRules.length while deleting, so it
  // stops about half way (121 rules leave 110). Turn into a plain `it` once fixed.
  it.failing('trims the stylesheet down to 100 rules', () => {
    const sheet = overfill();
    cleanupOldAnimations();
    expect(sheet.cssRules.length).toBeLessThanOrEqual(100);
  });
});
