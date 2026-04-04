/**
 * User engagement tracking (scroll, clicks, time on page)
 */

import type { EngagementMetrics } from './types';

export class EngagementTracker {
  private engagement: EngagementMetrics;
  private maxScrollDepth: number = 0;
  private interactionCount: number = 0;
  private clickCount: number = 0;
  private scrollTimeout?: NodeJS.Timeout;
  private onBusinessMetric?: (feature: string, action: string) => void;

  constructor(onBusinessMetric?: (feature: string, action: string) => void) {
    this.engagement = { timeOnPage: 0, scrollDepth: 0, interactions: 0, clicks: 0 };
    this.onBusinessMetric = onBusinessMetric;
    this.setupListeners();
  }

  private setupListeners() {
    // Scroll depth tracking
    window.addEventListener('scroll', () => {
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        const scrollHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const depth =
          scrollHeight > 0 ? Math.round((scrolled / scrollHeight) * 100) : 0;
        if (depth > this.maxScrollDepth) {
          this.maxScrollDepth = depth;
          this.engagement.scrollDepth = depth;
        }
      }, 100);
    });

    // Click tracking
    window.addEventListener('click', e => {
      this.clickCount++;
      this.engagement.clicks = this.clickCount;

      // Track business-relevant clicks
      const target = e.target as HTMLElement;
      if (target.closest('button, a')) {
        this.interactionCount++;
        this.engagement.interactions = this.interactionCount;
      }
    });

    // Form submission tracking
    window.addEventListener('submit', () => {
      this.onBusinessMetric?.('form_submit', 'submit');
    });
  }

  getMetrics(startTime: number): EngagementMetrics {
    return {
      ...this.engagement,
      timeOnPage: performance.now() - startTime,
    };
  }
}
