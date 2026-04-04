import { NextRequest, NextResponse } from 'next/server';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  screenWidth: number;
  screenHeight: number;
  browser: string;
  browserVersion: string;
  os: string;
  touchSupport: boolean;
}

interface EngagementMetrics {
  timeOnPage: number;
  scrollDepth: number;
  interactions: number;
  clicks: number;
}

interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
}

interface ResourceInfo {
  count: number;
  totalSize: number;
  cacheHits: number;
  cacheMisses: number;
}

interface PerformanceData {
  session: {
    sessionId: string;
    totalTime: number;
    metricsCount: number;
    vitalsCount: number;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone: string;
    };
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    };
    url: string;
    device?: DeviceInfo;
    engagement?: EngagementMetrics;
    errors?: ErrorInfo[];
    resources?: ResourceInfo;
  };
  metrics: any[];
  vitals: any[];
  timestamp: number;
  userAgent: string;
  device?: DeviceInfo;
  engagement?: EngagementMetrics;
  errors?: ErrorInfo[];
  resources?: ResourceInfo;
}

export async function POST(request: NextRequest) {
  try {
    const data: PerformanceData = await request.json();

    // Add server timestamp and IP info
    const serverData = {
      ...data,
      serverTimestamp: new Date().toISOString(),
      clientIP:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown',
      userAgent: request.headers.get('user-agent') || data.userAgent,
    };

    // Log to console
    console.log('Performance Data Received:', {
      sessionId: serverData.session.sessionId,
      location: `${serverData.session.location?.city}, ${serverData.session.location?.region}`,
      totalTime: `${serverData.session.totalTime.toFixed(2)}ms`,
      connection: serverData.session.connection?.effectiveType,
      metricsCount: serverData.session.metricsCount,
      url: serverData.session.url,
      page: new URL(serverData.session.url).pathname,
      clientIP: serverData.clientIP,
      device: serverData.device?.type || serverData.session.device?.type,
      browser: serverData.device?.browser || serverData.session.device?.browser,
      os: serverData.device?.os || serverData.session.device?.os,
    });

    // Log engagement metrics
    if (serverData.engagement || serverData.session.engagement) {
      const eng = serverData.engagement || serverData.session.engagement;
      if (eng) {
        console.log('Engagement:', {
          timeOnPage: `${(eng.timeOnPage / 1000).toFixed(2)}s`,
          scrollDepth: `${eng.scrollDepth}%`,
          interactions: eng.interactions,
          clicks: eng.clicks,
        });
      }
    }

    // Log errors if any
    if (serverData.errors?.length || serverData.session.errors?.length) {
      const errors = serverData.errors || serverData.session.errors || [];
      console.error('Errors Tracked:', errors.length, errors.slice(0, 3));
    }

    // Log resource info
    if (serverData.resources || serverData.session.resources) {
      const res = serverData.resources || serverData.session.resources;
      if (res) {
        console.log('Resources:', {
          count: res.count,
          totalSize: `${(res.totalSize / 1024).toFixed(2)}KB`,
          cacheHitRate: `${((res.cacheHits / (res.cacheHits + res.cacheMisses)) * 100).toFixed(1)}%`,
        });
      }
    }

    // Log detailed metrics for analysis
    console.log(
      'Detailed Metrics:',
      serverData.metrics.map(m => ({
        name: m.name,
        value: `${m.value.toFixed(2)}ms`,
        location: `${m.location?.city}, ${m.location?.region}`,
        connection: m.connection?.effectiveType,
      })),
    );

    // Log Web Vitals
    if (serverData.vitals.length > 0) {
      console.log(
        'Web Vitals:',
        serverData.vitals.map(v => ({
          name: v.name,
          value: `${v.value.toFixed(2)}ms`,
          rating: v.rating,
        })),
      );
    }

    // Send to CloudWatch if enabled
    if (process.env.AWS_REGION) {
      try {
        await sendToCloudWatch(serverData);
        console.log('Sent to CloudWatch');
      } catch (error) {
        console.error('Failed to send to CloudWatch:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Performance data received',
      sessionId: serverData.session.sessionId,
    });
  } catch (error) {
    console.error('Error processing performance data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process performance data' },
      { status: 500 },
    );
  }
}

// Optional: GET endpoint to retrieve performance data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  // This is just a placeholder - implement based on your storage solution
  return NextResponse.json({
    message: 'Performance data retrieval not implemented yet',
    sessionId,
    tip: 'Check server logs for performance data or implement database storage',
  });
}

// Helper function for CloudWatch integration
async function sendToCloudWatch(data: any) {
  const client = new CloudWatchClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  // Extract page path from URL and holiday type
  const pagePath = new URL(data.session.url).pathname;
  const holidayMatch = pagePath.match(
    /\/(christmas|birthday|valentines|halloween|thanksgiving|easter|mothers-day|fathers-day|graduation|anniversary|new-year|fourth-of-july|hanukkah|kwanzaa|baby-shower)/,
  );
  const holidayType = holidayMatch ? holidayMatch[1] : 'home';

  // Get device info
  const device = data.device || data.session.device || {};
  const engagement = data.engagement || data.session.engagement || {};
  const resources = data.resources || data.session.resources || {};
  const errors = data.errors || data.session.errors || [];

  // Send individual metrics with comprehensive dimensions
  const metricData = data.metrics.map((metric: any) => ({
    MetricName: metric.name,
    Value: metric.value,
    Unit: 'Milliseconds',
    Dimensions: [
      { Name: 'Page', Value: pagePath },
      { Name: 'Holiday', Value: metric.business?.holidayType || holidayType },
      { Name: 'DeviceType', Value: metric.device?.type || device.type || 'Unknown' },
      {
        Name: 'Browser',
        Value: metric.device?.browser || device.browser || 'Unknown',
      },
      { Name: 'OS', Value: metric.device?.os || device.os || 'Unknown' },
      { Name: 'Location', Value: metric.location?.city || 'Unknown' },
      { Name: 'Region', Value: metric.location?.region || 'Unknown' },
      { Name: 'Connection', Value: metric.connection?.effectiveType || 'Unknown' },
    ],
    Timestamp: new Date(metric.timestamp),
  }));

  // Send web vitals with comprehensive dimensions
  const vitalsData = data.vitals.map((vital: any) => ({
    MetricName: vital.name,
    Value: vital.value,
    Unit: vital.name === 'CLS' ? 'None' : 'Milliseconds',
    Dimensions: [
      { Name: 'Page', Value: pagePath },
      { Name: 'Holiday', Value: holidayType },
      { Name: 'Rating', Value: vital.rating || 'unknown' },
      { Name: 'DeviceType', Value: device.type || 'Unknown' },
      { Name: 'Browser', Value: device.browser || 'Unknown' },
      { Name: 'Location', Value: data.session.location?.city || 'Unknown' },
      { Name: 'Region', Value: data.session.location?.region || 'Unknown' },
    ],
    Timestamp: new Date(vital.timestamp || Date.now()),
  }));

  // Send page view count metric
  const pageViewMetric = [
    {
      MetricName: 'PageView',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'Page', Value: pagePath },
        { Name: 'Holiday', Value: holidayType },
        { Name: 'DeviceType', Value: device.type || 'Unknown' },
        { Name: 'Browser', Value: device.browser || 'Unknown' },
        { Name: 'OS', Value: device.os || 'Unknown' },
        { Name: 'Location', Value: data.session.location?.city || 'Unknown' },
        { Name: 'Region', Value: data.session.location?.region || 'Unknown' },
      ],
      Timestamp: new Date(),
    },
  ];

  // Send engagement metrics
  const engagementMetrics = [];
  if (engagement.timeOnPage > 0) {
    engagementMetrics.push({
      MetricName: 'TimeOnPage',
      Value: engagement.timeOnPage / 1000, // Convert to seconds
      Unit: 'Seconds',
      Dimensions: [
        { Name: 'Page', Value: pagePath },
        { Name: 'Holiday', Value: holidayType },
        { Name: 'DeviceType', Value: device.type || 'Unknown' },
      ],
      Timestamp: new Date(),
    });
  }
  if (engagement.scrollDepth > 0) {
    engagementMetrics.push({
      MetricName: 'ScrollDepth',
      Value: engagement.scrollDepth,
      Unit: 'Percent',
      Dimensions: [
        { Name: 'Page', Value: pagePath },
        { Name: 'Holiday', Value: holidayType },
      ],
      Timestamp: new Date(),
    });
  }
  if (engagement.interactions > 0) {
    engagementMetrics.push({
      MetricName: 'Interactions',
      Value: engagement.interactions,
      Unit: 'Count',
      Dimensions: [
        { Name: 'Page', Value: pagePath },
        { Name: 'Holiday', Value: holidayType },
      ],
      Timestamp: new Date(),
    });
  }

  // Send error metrics
  const errorMetrics = [];
  if (errors.length > 0) {
    errorMetrics.push({
      MetricName: 'ErrorCount',
      Value: errors.length,
      Unit: 'Count',
      Dimensions: [
        { Name: 'Page', Value: pagePath },
        { Name: 'Holiday', Value: holidayType },
        { Name: 'Browser', Value: device.browser || 'Unknown' },
      ],
      Timestamp: new Date(),
    });
  }

  // Send resource metrics
  const resourceMetrics = [];
  if (resources.count > 0) {
    resourceMetrics.push(
      {
        MetricName: 'ResourceCount',
        Value: resources.count,
        Unit: 'Count',
        Dimensions: [{ Name: 'Page', Value: pagePath }],
        Timestamp: new Date(),
      },
      {
        MetricName: 'PageSize',
        Value: resources.totalSize / 1024, // Convert to KB
        Unit: 'Kilobytes',
        Dimensions: [{ Name: 'Page', Value: pagePath }],
        Timestamp: new Date(),
      },
      {
        MetricName: 'CacheHitRate',
        Value:
          (resources.cacheHits / (resources.cacheHits + resources.cacheMisses)) *
          100,
        Unit: 'Percent',
        Dimensions: [{ Name: 'Page', Value: pagePath }],
        Timestamp: new Date(),
      },
    );
  }

  const params = {
    Namespace: 'NextHoliday_Performance',
    MetricData: [
      ...metricData,
      ...vitalsData,
      ...pageViewMetric,
      ...engagementMetrics,
      ...errorMetrics,
      ...resourceMetrics,
    ],
  };

  const command = new PutMetricDataCommand(params);
  return client.send(command);
}
