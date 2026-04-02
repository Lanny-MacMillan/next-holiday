/**
 * Performance Monitoring for AWS Amplify deployment
 * Tracks Core Web Vitals, geographic performance, and custom metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: any;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone: string;
  };
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private vitals: WebVitalsMetric[] = [];
  private sessionId: string;
  private startTime: number;
  private cumulativeCLS: number = 0; // Track cumulative CLS
  private cachedLocation: any = null; // Cache location to avoid repeated requests
  private locationFetchAttempted: boolean = false; // Track if we've already tried

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();
    this.setupEventListeners();
    // Fetch location once at startup
    this.getLocationInfo();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private async getLocationInfo() {
    // Return cached location if we have it
    if (this.cachedLocation) {
      return this.cachedLocation;
    }

    // Don't try again if we've already failed
    if (this.locationFetchAttempted) {
      return this.getBasicLocationInfo();
    }

    this.locationFetchAttempted = true;

    try {
      // Try to get location from timezone first (most reliable)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // For more detailed location, try IP geolocation service with CORS handling
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          mode: 'cors', // Explicitly set CORS mode
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const locationData = await response.json();
          this.cachedLocation = {
            timezone,
            country: locationData?.country_name,
            region: locationData?.region,
            city: locationData?.city,
          };
          return this.cachedLocation;
        }
      } catch (ipApiError) {
        // Silently handle CORS and other IP API errors - only log once
        console.warn('IP geolocation service unavailable, using timezone only');
      }

      // Cache the basic location info as fallback
      this.cachedLocation = this.getBasicLocationInfo();
      return this.cachedLocation;
    } catch (error) {
      // Ultimate fallback
      this.cachedLocation = this.getBasicLocationInfo();
      return this.cachedLocation;
    }
  }

  private getBasicLocationInfo() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
    };
  }

  private getConnectionInfo() {
    // Handle experimental network connection API safely
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return null;
  }

  private setupEventListeners() {
    // Page Load Performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => this.capturePageLoadMetrics(), 100);
      });

      // Capture navigation timing when available
      if ('navigation' in performance) {
        // @ts-ignore
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.captureNavigationTiming(entry as PerformanceNavigationTiming);
            }
          }
        }).observe({ entryTypes: ['navigation'] });
      }

      // Web Vitals tracking
      this.setupWebVitals();
    }
  }

  private async capturePageLoadMetrics() {
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        const metrics = [
          {
            name: 'DNS_TIME',
            value: navigation.domainLookupEnd - navigation.domainLookupStart,
          },
          {
            name: 'TCP_TIME',
            value: navigation.connectEnd - navigation.connectStart,
          },
          {
            name: 'REQUEST_TIME',
            value: navigation.responseStart - navigation.requestStart,
          },
          {
            name: 'RESPONSE_TIME',
            value: navigation.responseEnd - navigation.responseStart,
          },
          {
            name: 'DOM_PROCESSING',
            value: navigation.domContentLoadedEventStart - navigation.responseEnd,
          },
          {
            name: 'LOAD_EVENT',
            value: navigation.loadEventEnd - navigation.loadEventStart,
          },
          {
            name: 'TOTAL_TIME',
            value: navigation.loadEventEnd - navigation.startTime,
          },
        ];

        // Get location once and use for all metrics
        const location = await this.getLocationInfo();
        metrics.forEach(metric =>
          this.addMetric(metric.name, metric.value, location),
        );
      }
    }
  }

  private captureNavigationTiming(entry: PerformanceNavigationTiming) {
    // Additional navigation metrics
    const metrics = [
      { name: 'DNS_LOOKUP', value: entry.domainLookupEnd - entry.domainLookupStart },
      { name: 'SSL_TIME', value: entry.connectEnd - entry.secureConnectionStart },
      { name: 'SERVER_RESPONSE', value: entry.responseStart - entry.requestStart },
      {
        name: 'DOM_INTERACTIVE',
        value: entry.domInteractive - entry.startTime,
      },
      { name: 'DOM_COMPLETE', value: entry.domComplete - entry.startTime },
    ];

    metrics.forEach(async metric => {
      const location = await this.getLocationInfo();
      this.addMetric(metric.name, metric.value, location);
    });
  }

  private setupWebVitals() {
    // Core Web Vitals measurement
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        this.handleWebVital(entry);
      }
    });

    // Observe different metric types
    try {
      observer.observe({
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'],
      });
    } catch (e) {
      // Fallback for browsers that don't support all metrics
      console.error('Some Web Vitals not supported:', e);
    }

    // First Contentful Paint
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.addWebVital('FCP', entry.startTime);
          }
        }
      }).observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.error('FCP not supported');
    }
  }

  private handleWebVital(entry: PerformanceEntry) {
    let name: WebVitalsMetric['name'];
    let value: number;

    switch (entry.entryType) {
      case 'largest-contentful-paint':
        name = 'LCP';
        value = entry.startTime;
        this.addWebVital(name, value);
        break;
      case 'first-input':
        name = 'FID';
        value = (entry as any).processingStart - entry.startTime;
        this.addWebVital(name, value);
        break;
      case 'layout-shift':
        // Handle CLS cumulatively
        const layoutShiftValue = (entry as any).value;
        this.cumulativeCLS += layoutShiftValue;

        // Only update/add CLS if there's an actual shift or it's the first measurement
        if (
          layoutShiftValue > 0 ||
          this.vitals.filter(v => v.name === 'CLS').length === 0
        ) {
          // Remove existing CLS entry if it exists
          this.vitals = this.vitals.filter(v => v.name !== 'CLS');

          // Add updated cumulative CLS
          name = 'CLS';
          value = this.cumulativeCLS;
          this.addWebVital(name, value);
        }
        break;
      default:
        return;
    }
  }

  private addWebVital(name: WebVitalsMetric['name'], value: number) {
    const rating = this.getRating(name, value);

    this.vitals.push({ name, value, rating });

    // Also add as regular metric
    this.getLocationInfo().then(location => {
      this.addMetric(`WEBVITAL_${name}`, value, location);
    });
  }

  private getRating(
    name: WebVitalsMetric['name'],
    value: number,
  ): WebVitalsMetric['rating'] {
    const thresholds = {
      FCP: [1800, 3000],
      LCP: [2500, 4000],
      FID: [100, 300],
      CLS: [0.1, 0.25],
      TTFB: [800, 1800],
      INP: [200, 500],
    };

    const [good, poor] = thresholds[name] || [0, 0];

    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  private async addMetric(name: string, value: number, location?: any) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      location: location || {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    this.metrics.push(metric);

    // Try to get location info asynchronously after adding the metric
    if (!location) {
      // Use cached location instead of fetching again
      this.getLocationInfo()
        .then(locationData => {
          metric.location = locationData;
        })
        .catch(() => {
          // Keep the basic timezone info if location fetch fails
        });
    }
  }

  // Public methods
  public measureCustom(
    name: string,
    fn: () => Promise<any> | any,
  ): Promise<any> | any {
    const start = performance.now();

    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        this.getLocationInfo().then(location => {
          this.addMetric(`CUSTOM_${name}`, duration, location);
        });
      });
    } else {
      const duration = performance.now() - start;
      this.getLocationInfo().then(location => {
        this.addMetric(`CUSTOM_${name}`, duration, location);
      });
      return result;
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getWebVitals(): WebVitalsMetric[] {
    return [...this.vitals];
  }

  // Force collect some basic metrics for testing
  public collectTestMetrics() {
    // Add some test metrics if none exist
    if (this.metrics.length === 0) {
      const testMetrics = [
        { name: 'PAGE_LOAD_START', value: performance.now() },
        {
          name: 'DOM_READY',
          value: document.readyState === 'complete' ? 0 : performance.now(),
        },
      ];

      testMetrics.forEach(metric => {
        this.addMetric(metric.name, metric.value);
      });
    }

    // Try to collect navigation timing if available
    if (this.metrics.filter(m => m.name.includes('DNS')).length === 0) {
      this.capturePageLoadMetrics();
    }
  }

  public getSummary() {
    const totalTime = performance.now() - this.startTime;

    return {
      sessionId: this.sessionId,
      totalTime,
      metricsCount: this.metrics.length,
      vitalsCount: this.vitals.length,
      location: this.metrics[0]?.location,
      connection: this.metrics[0]?.connection,
      url: window.location.href,
    };
  }

  // Send data to your preferred analytics service
  public async sendToAnalytics(endpoint?: string) {
    const data = {
      session: this.getSummary(),
      metrics: this.getMetrics(),
      vitals: this.getWebVitals(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };

    // Default to local API endpoint if none provided
    const apiEndpoint = endpoint || '/api/performance';

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
      } else {
        console.error('Failed to send performance data:', response.statusText);
      }
    } catch (e) {
      console.error('Failed to send analytics:', e);
    }

    return data;
  }

  // TODO: Integration with AWS CloudWatch
  public async sendToCloudWatch(region: string = 'us-east-1') {
    // TODO: AWS SDK - implement based on AWS setup
    const summary = this.getSummary();

    console.log('CloudWatch Metrics Ready:', {
      namespace: 'NextHoliday/Performance',
      region,
      metrics: this.metrics.map(m => ({
        MetricName: m.name,
        Value: m.value,
        Unit: 'Milliseconds',
        Dimensions: [
          { Name: 'Location', Value: m.location?.city || 'Unknown' },
          { Name: 'Connection', Value: m.connection?.effectiveType || 'Unknown' },
        ],
      })),
    });
  }
}

// Global instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitor(): PerformanceMonitor {
  if (typeof window !== 'undefined') {
    if (!performanceMonitor) {
      performanceMonitor = new PerformanceMonitor();
    }
    return performanceMonitor;
  }

  // Return a dummy monitor for server-side
  console.warn('Performance Monitor cannot be initialized on server-side');
  return null as any;
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

// Utility functions for easy use
export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const monitor = getPerformanceMonitor();
  if (monitor) {
    return monitor.measureCustom(name, fn) as Promise<T>;
  }
  return fn();
}

export function measureSync<T>(name: string, fn: () => T): T {
  const monitor = getPerformanceMonitor();
  if (monitor) {
    return monitor.measureCustom(name, fn) as T;
  }
  return fn();
}
