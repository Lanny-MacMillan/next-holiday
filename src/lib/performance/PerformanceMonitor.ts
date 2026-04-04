/**
 * Main Performance Monitor class
 * Orchestrates all performance tracking components
 */

import type {
  PerformanceMetric,
  WebVitalsMetric,
  DeviceInfo,
  EngagementMetrics,
  ErrorInfo,
  ResourceInfo,
  BusinessMetrics,
  LocationInfo,
  SessionSummary,
} from './types';
import {
  generateSessionId,
  getConnectionInfo,
  extractHolidayFromPath,
} from './utils';
import { detectDevice } from './device-detection';
import { LocationService } from './location-service';
import { EngagementTracker } from './engagement-tracker';
import { ErrorTracker } from './error-tracker';
import { WebVitalsTracker } from './web-vitals';

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private startTime: number;
  private deviceInfo: DeviceInfo;
  private resourceInfo: ResourceInfo;

  private locationService: LocationService;
  private engagementTracker: EngagementTracker;
  private errorTracker: ErrorTracker;
  private webVitalsTracker: WebVitalsTracker;

  constructor() {
    this.sessionId = generateSessionId();
    this.startTime = performance.now();
    this.deviceInfo = detectDevice();
    this.resourceInfo = { count: 0, totalSize: 0, cacheHits: 0, cacheMisses: 0 };

    // Initialize trackers
    this.locationService = new LocationService();
    this.engagementTracker = new EngagementTracker((feature, action) => {
      this.trackBusinessMetric(feature, action);
    });
    this.errorTracker = new ErrorTracker();
    this.webVitalsTracker = new WebVitalsTracker((name, value) => {
      this.locationService.getLocationInfo().then(location => {
        this.addMetric(name, value, location);
      });
    });

    this.setupEventListeners();
    // Fetch location once at startup
    this.locationService.getLocationInfo();
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.capturePageLoadMetrics();
          this.captureResourceMetrics();
        }, 100);
      });

      // Capture navigation timing when available
      if ('navigation' in performance) {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.captureNavigationTiming(entry as PerformanceNavigationTiming);
            }
          }
        }).observe({ entryTypes: ['navigation'] });
      }

      // Page visibility tracking
      this.setupVisibilityTracking();
    }
  }

  private setupVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Send metrics when user leaves
        this.sendToAnalytics();
      }
    });

    // Send on page unload
    window.addEventListener('beforeunload', () => {
      // Engagement metrics are captured by the tracker
    });
  }

  private captureResourceMetrics() {
    const resources = performance.getEntriesByType(
      'resource',
    ) as PerformanceResourceTiming[];

    let totalSize = 0;
    let cacheHits = 0;
    let cacheMisses = 0;

    resources.forEach(resource => {
      totalSize += resource.transferSize || 0;

      if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
        cacheHits++;
      } else {
        cacheMisses++;
      }
    });

    this.resourceInfo = {
      count: resources.length,
      totalSize,
      cacheHits,
      cacheMisses,
    };
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

        const location = await this.locationService.getLocationInfo();
        metrics.forEach(metric =>
          this.addMetric(metric.name, metric.value, location),
        );
      }
    }
  }

  private captureNavigationTiming(entry: PerformanceNavigationTiming) {
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
      const location = await this.locationService.getLocationInfo();
      this.addMetric(metric.name, metric.value, location);
    });
  }

  private async addMetric(
    name: string,
    value: number,
    location?: LocationInfo,
    business?: BusinessMetrics,
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: getConnectionInfo(),
      location: location || {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      device: this.deviceInfo,
      business: business,
    };

    this.metrics.push(metric);

    if (!location) {
      this.locationService
        .getLocationInfo()
        .then(locationData => {
          metric.location = locationData;
        })
        .catch(() => {
          // Keep the basic timezone info if location fetch fails
        });
    }
  }

  // Public methods
  public trackBusinessMetric(featureUsed: string, userAction: string) {
    const path = window.location.pathname;
    const holidayType = extractHolidayFromPath(path);

    const business: BusinessMetrics = {
      holidayType,
      featureUsed,
      userAction,
    };

    this.locationService.getLocationInfo().then(location => {
      this.addMetric(`BUSINESS_${userAction}`, 1, location, business);
    });
  }

  public measureCustom(
    name: string,
    fn: () => Promise<any> | any,
  ): Promise<any> | any {
    const start = performance.now();
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        this.locationService.getLocationInfo().then(location => {
          this.addMetric(`CUSTOM_${name}`, duration, location);
        });
      });
    } else {
      const duration = performance.now() - start;
      this.locationService.getLocationInfo().then(location => {
        this.addMetric(`CUSTOM_${name}`, duration, location);
      });
      return result;
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getWebVitals(): WebVitalsMetric[] {
    return this.webVitalsTracker.getVitals();
  }

  public getEngagement(): EngagementMetrics {
    return this.engagementTracker.getMetrics(this.startTime);
  }

  public getErrors(): ErrorInfo[] {
    return this.errorTracker.getErrors();
  }

  public getResourceInfo(): ResourceInfo {
    return { ...this.resourceInfo };
  }

  public getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  public collectTestMetrics() {
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

    if (this.metrics.filter(m => m.name.includes('DNS')).length === 0) {
      this.capturePageLoadMetrics();
    }
  }

  public getSummary(): SessionSummary {
    const totalTime = performance.now() - this.startTime;

    return {
      sessionId: this.sessionId,
      totalTime,
      metricsCount: this.metrics.length,
      vitalsCount: this.getWebVitals().length,
      location: this.metrics[0]?.location,
      connection: this.metrics[0]?.connection,
      url: window.location.href,
      device: this.deviceInfo,
      engagement: this.getEngagement(),
      errors: this.getErrors(),
      resources: this.resourceInfo,
    };
  }

  public async sendToAnalytics(endpoint?: string) {
    const data = {
      session: this.getSummary(),
      metrics: this.getMetrics(),
      vitals: this.getWebVitals(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      device: this.deviceInfo,
      engagement: this.getEngagement(),
      errors: this.getErrors(),
      resources: this.resourceInfo,
    };

    const apiEndpoint = endpoint || '/api/performance';

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add API key if configured (for CloudWatch protection)
      const apiKey = process.env.NEXT_PUBLIC_PERFORMANCE_API_KEY;
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await response.json();
      } else {
        console.error('Failed to send performance data:', response.statusText);
      }
    } catch (e) {
      console.error('Failed to send analytics:', e);
    }

    return data;
  }

  public async sendToCloudWatch(region: string = 'us-east-1') {
    const summary = this.getSummary();

    console.log('CloudWatch Metrics Ready:', {
      namespace: 'NextHoliday_Performance',
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
