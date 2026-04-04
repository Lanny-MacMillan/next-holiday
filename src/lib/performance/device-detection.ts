/**
 * Device, browser, and OS detection
 */

import type { DeviceInfo } from './types';

export function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    ua,
  );
  const isTablet =
    /iPad|Android(?!.*Mobile)/i.test(ua) || (isMobile && screenWidth > 600);
  const type = isMobile ? (isTablet ? 'tablet' : 'mobile') : 'desktop';

  // Detect browser
  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  if (ua.includes('Edg/') || ua.includes('Edge/')) {
    browser = 'Edge';
    browserVersion = ua.match(/(?:Edg|Edge)\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Chrome')) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Safari')) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  }

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad'))
    os = 'iOS';

  return {
    type,
    screenWidth,
    screenHeight,
    browser,
    browserVersion,
    os,
    touchSupport: 'ontouchstart' in window,
  };
}
