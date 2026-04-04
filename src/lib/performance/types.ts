/**
 * Type definitions for Performance Monitoring
 */

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  screenWidth: number;
  screenHeight: number;
  browser: string;
  browserVersion: string;
  os: string;
  touchSupport: boolean;
}

export interface EngagementMetrics {
  timeOnPage: number;
  scrollDepth: number;
  interactions: number;
  clicks: number;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
}

export interface ResourceInfo {
  count: number;
  totalSize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface BusinessMetrics {
  holidayType?: string;
  featureUsed?: string;
  userAction?: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone: string;
}

export interface ConnectionInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: ConnectionInfo;
  location?: LocationInfo;
  device?: DeviceInfo;
  business?: BusinessMetrics;
}

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface SessionSummary {
  sessionId: string;
  totalTime: number;
  metricsCount: number;
  vitalsCount: number;
  location?: LocationInfo;
  connection?: ConnectionInfo;
  url: string;
  device: DeviceInfo;
  engagement: EngagementMetrics;
  errors: ErrorInfo[];
  resources: ResourceInfo;
}
