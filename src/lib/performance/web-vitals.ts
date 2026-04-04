/**
 * Core Web Vitals tracking (LCP, FID, CLS, FCP, etc.)
 */

import type { WebVitalsMetric } from './types';

export class WebVitalsTracker {
  private vitals: WebVitalsMetric[] = [];
  private cumulativeCLS: number = 0;
  private onMetric?: (name: string, value: number) => void;

  constructor(onMetric?: (name: string, value: number) => void) {
    this.onMetric = onMetric;
    this.setupObservers();
  }

  private setupObservers() {
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

    // Notify parent monitor
    this.onMetric?.(`WEBVITAL_${name}`, value);
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

  getVitals(): WebVitalsMetric[] {
    return [...this.vitals];
  }
}
