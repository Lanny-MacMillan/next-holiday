/**
 * JavaScript error and promise rejection tracking
 */

import type { ErrorInfo } from './types';

export class ErrorTracker {
  private errors: ErrorInfo[] = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // JavaScript errors
    window.addEventListener('error', event => {
      this.errors.push({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.errors.push({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        timestamp: Date.now(),
        url: window.location.href,
      });
    });
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }
}
