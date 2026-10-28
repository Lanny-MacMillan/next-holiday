/**
 * @jest-environment jsdom
 */
import { detectDevice } from '@/lib/performance/device-detection';
import { ErrorTracker } from '@/lib/performance/error-tracker';
import { EngagementTracker } from '@/lib/performance/engagement-tracker';
import {
  extractHolidayFromPath,
  generateSessionId,
  getConnectionInfo,
} from '@/lib/performance/utils';

const setUserAgent = (ua: string) =>
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
const setWidth = (w: number) =>
  Object.defineProperty(window, 'innerWidth', {
    value: w,
    configurable: true,
    writable: true,
  });

describe('detectDevice', () => {
  const UA = {
    chromeMac:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    edgeWin:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.2151.58',
    safariMac:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    firefoxLinux:
      'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
    androidPhone:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    androidTablet:
      'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    iphone:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ipad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  };

  beforeEach(() => setWidth(1280));

  it.each([
    ['chromeMac', 'desktop', 'Chrome', '120', 'macOS'],
    ['edgeWin', 'desktop', 'Edge', '119', 'Windows'],
    ['safariMac', 'desktop', 'Safari', '17', 'macOS'],
    ['firefoxLinux', 'desktop', 'Firefox', '121', 'Linux'],
  ] as const)('reads %s', (key, type, browser, version, os) => {
    setUserAgent(UA[key]);
    expect(detectDevice()).toMatchObject({
      type,
      browser,
      browserVersion: version,
      os,
    });
  });

  it('calls an Android phone mobile', () => {
    setUserAgent(UA.androidPhone);
    setWidth(400);
    expect(detectDevice()).toMatchObject({ type: 'mobile', os: 'Android' });
  });

  it('calls an Android without "Mobile" a tablet', () => {
    setUserAgent(UA.androidTablet);
    expect(detectDevice().type).toBe('tablet');
  });

  it('calls a wide iPhone a tablet, but an iPad desktop (iPad is not in the mobile pattern)', () => {
    setUserAgent(UA.iphone);
    setWidth(800);
    expect(detectDevice().type).toBe('tablet');
    setUserAgent(UA.ipad);
    expect(detectDevice().type).toBe('desktop');
  });

  it('falls back to Unknown for an unrecognised agent', () => {
    setUserAgent('curl/8.0');
    expect(detectDevice()).toMatchObject({
      browser: 'Unknown',
      browserVersion: 'Unknown',
      os: 'Unknown',
    });
  });

  it('reports the window size and touch support', () => {
    setUserAgent(UA.chromeMac);
    setWidth(1024);
    const info = detectDevice();
    expect(info.screenWidth).toBe(1024);
    expect(info.screenHeight).toBe(window.innerHeight);
    expect(typeof info.touchSupport).toBe('boolean');
  });
});

describe('utils', () => {
  it('makes a different session id each time', () => {
    const ids = new Set(Array.from({ length: 20 }, generateSessionId));
    expect(ids.size).toBe(20);
    expect([...ids][0]).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it.each([
    ['/christmas/gift-list', 'christmas'],
    ['/mothers-day', 'mothers-day'],
    ['/fourth-of-july/tasks', 'fourth-of-july'],
    ['/baby-shower/guest-list', 'baby-shower'],
    ['/settings', 'home'],
    ['/', 'home'],
  ])('maps %s to %s', (path, expected) => {
    expect(extractHolidayFromPath(path)).toBe(expected);
  });

  describe('getConnectionInfo', () => {
    afterEach(() => {
      delete (navigator as any).connection;
      delete (navigator as any).mozConnection;
    });

    it('is undefined when the browser has no network API', () => {
      expect(getConnectionInfo()).toBeUndefined();
    });

    it('returns the fields of the first connection object it finds', () => {
      (navigator as any).mozConnection = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        extra: 'ignored',
      };
      expect(getConnectionInfo()).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      });
    });
  });
});

describe('ErrorTracker', () => {
  it('records script errors and unhandled rejections with the page url', () => {
    const tracker = new ErrorTracker();
    const err = new Error('kaboom');
    window.dispatchEvent(new ErrorEvent('error', { message: 'kaboom', error: err }));
    const rejection = new Event('unhandledrejection') as Event & {
      reason?: unknown;
    };
    rejection.reason = 'nope';
    window.dispatchEvent(rejection);

    const errors = tracker.getErrors();
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatchObject({
      message: 'kaboom',
      stack: err.stack,
      url: window.location.href,
    });
    expect(errors[1]).toMatchObject({
      message: 'Unhandled Promise Rejection: nope',
    });
    expect(errors[1].stack).toBeUndefined();
  });

  it('hands out a copy of the list', () => {
    const tracker = new ErrorTracker();
    tracker.getErrors().push({} as never);
    expect(tracker.getErrors()).toEqual([]);
  });
});

describe('EngagementTracker', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('counts clicks, and interactions only on buttons and links', () => {
    const tracker = new EngagementTracker();
    document.body.innerHTML =
      '<button id="b"><span id="in">x</span></button><p id="p">t</p>';
    document.getElementById('p')!.click();
    document.getElementById('in')!.click();
    document.getElementById('b')!.click();
    expect(tracker.getMetrics(0)).toMatchObject({ clicks: 3, interactions: 2 });
  });

  it('reports a form submission to the callback', () => {
    const onMetric = jest.fn();
    new EngagementTracker(onMetric);
    window.dispatchEvent(new Event('submit'));
    expect(onMetric).toHaveBeenCalledWith('form_submit', 'submit');
  });

  it('does not mind a form submission with no callback', () => {
    new EngagementTracker();
    expect(() => window.dispatchEvent(new Event('submit'))).not.toThrow();
  });

  it('keeps the deepest scroll position, debounced', () => {
    const tracker = new EngagementTracker();
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 1000,
      configurable: true,
      writable: true,
    });
    const scrollTo = (y: number) => {
      Object.defineProperty(window, 'scrollY', {
        value: y,
        configurable: true,
        writable: true,
      });
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(100);
    };

    scrollTo(500);
    expect(tracker.getMetrics(0).scrollDepth).toBe(50);
    scrollTo(200);
    expect(tracker.getMetrics(0).scrollDepth).toBe(50);
    scrollTo(1000);
    expect(tracker.getMetrics(0).scrollDepth).toBe(100);
  });

  it('measures time on page from the start time', () => {
    const tracker = new EngagementTracker();
    jest.spyOn(performance, 'now').mockReturnValue(5000);
    expect(tracker.getMetrics(2000).timeOnPage).toBe(3000);
  });
});
