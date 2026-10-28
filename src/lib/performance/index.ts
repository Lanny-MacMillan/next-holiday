/**
 * Performance Monitoring for AWS Amplify deployment
 *
 * Public API for performance tracking including:
 * - Core Web Vitals (LCP, FID, CLS, FCP)
 * - Page load metrics
 * - User engagement tracking
 * - Error monitoring
 * - Device/browser detection
 * - Geographic performance data
 */

import { PerformanceMonitor } from './PerformanceMonitor';

// Export types
// Export the main class
export { PerformanceMonitor };

// Global instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitor(): PerformanceMonitor | null {
  if (typeof window !== 'undefined') {
    if (!performanceMonitor) {
      performanceMonitor = new PerformanceMonitor();
    }
    return performanceMonitor;
  }

  // Return null for server-side
  console.warn('Performance Monitor cannot be initialized on server-side');
  return null;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

// Ensure performance monitor is initialized when this module loads in browser
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure DOM is ready
  setTimeout(() => {
    initPerformanceMonitor();
  }, 100);
}
