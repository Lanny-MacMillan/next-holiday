import { useEffect } from 'react';
import { getPerformanceMonitor } from '@/lib/performance';

/**
 * Hook to automatically track and send performance data at key moments
 */
export function usePerformanceTracking() {
  useEffect(() => {
    const monitor = getPerformanceMonitor();
    if (!monitor) return;

    // Send data after initial page load
    const timer = setTimeout(() => {
      monitor.sendToAnalytics();
    }, 3000); // Wait 3 seconds for page to settle

    // Send data when user leaves the page
    const handleBeforeUnload = () => {
      monitor.sendToAnalytics();
    };

    // Send data when page becomes hidden (mobile app switching, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        monitor.sendToAnalytics();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    measureAsync: (name: string, fn: () => Promise<any>) => {
      const monitor = getPerformanceMonitor();
      return monitor ? monitor.measureCustom(name, fn) : fn();
    },

    measureSync: (name: string, fn: () => any) => {
      const monitor = getPerformanceMonitor();
      return monitor ? monitor.measureCustom(name, fn) : fn();
    },

    sendData: () => {
      const monitor = getPerformanceMonitor();
      if (monitor) {
        return monitor.sendToAnalytics();
      }
    },
  };
}
