import { NextRequest, NextResponse } from 'next/server';

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
  };
  metrics: any[];
  vitals: any[];
  timestamp: number;
  userAgent: string;
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

    // Log to console (you can redirect this to CloudWatch or other logging service)
    console.log('🚀 Performance Data Received:', {
      sessionId: serverData.session.sessionId,
      location: `${serverData.session.location?.city}, ${serverData.session.location?.region}`,
      totalTime: `${serverData.session.totalTime.toFixed(2)}ms`,
      connection: serverData.session.connection?.effectiveType,
      metricsCount: serverData.session.metricsCount,
      url: serverData.session.url,
      clientIP: serverData.clientIP,
    });

    // Log detailed metrics for analysis
    console.log(
      '📊 Detailed Metrics:',
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
        '💯 Web Vitals:',
        serverData.vitals.map(v => ({
          name: v.name,
          value: `${v.value.toFixed(2)}ms`,
          rating: v.rating,
        })),
      );
    }

    // Here you can:
    // 1. Store in database
    // 2. Send to AWS CloudWatch
    // 3. Send to third-party analytics
    // 4. Process for real-time dashboards

    // Example: Send to CloudWatch (uncomment if you set up AWS SDK)
    /*
    if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID) {
      await sendToCloudWatch(serverData);
    }
    */

    // Example: Store in database (uncomment if you want to persist)
    /*
    await prisma.performanceMetric.create({
      data: {
        sessionId: serverData.session.sessionId,
        location: serverData.session.location?.city,
        region: serverData.session.location?.region,
        country: serverData.session.location?.country,
        connection: serverData.session.connection?.effectiveType,
        totalTime: serverData.session.totalTime,
        metricsCount: serverData.session.metricsCount,
        vitalsCount: serverData.session.vitalsCount,
        data: JSON.stringify(serverData),
        clientIP: serverData.clientIP,
        userAgent: serverData.userAgent,
      }
    });
    */

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

// Helper function for CloudWatch integration (optional)
/*
async function sendToCloudWatch(data: any) {
  // Implement CloudWatch metrics sending
  // This would require AWS SDK setup
  const AWS = require('aws-sdk');
  const cloudwatch = new AWS.CloudWatch({ region: process.env.AWS_REGION });
  
  const params = {
    Namespace: 'NextHoliday/Performance',
    MetricData: data.metrics.map((metric: any) => ({
      MetricName: metric.name,
      Value: metric.value,
      Unit: 'Milliseconds',
      Dimensions: [
        { Name: 'Location', Value: metric.location?.city || 'Unknown' },
        { Name: 'Region', Value: metric.location?.region || 'Unknown' },
        { Name: 'Connection', Value: metric.connection?.effectiveType || 'Unknown' }
      ],
      Timestamp: new Date(metric.timestamp)
    }))
  };
  
  return cloudwatch.putMetricData(params).promise();
}
*/
