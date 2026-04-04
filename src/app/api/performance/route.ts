import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (for production, use Redis or Upstash)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

// Clean up old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, RATE_LIMIT_WINDOW);
}

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
    // Get client IP for rate limiting
    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many requests. Please try again later.',
          retryAfter: 60 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + 60).toString(),
            'Retry-After': '60',
          }
        },
      );
    }

    // Validate API key to prevent unauthorized CloudWatch spam
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.PERFORMANCE_API_KEY;
    
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const data: PerformanceData = await request.json();

    // Add server timestamp and IP info
    const serverData = {
      ...data,
      serverTimestamp: new Date().toISOString(),
      clientIP,
      userAgent: request.headers.get('user-agent') || data.userAgent,
    };

    // Safely extract page path from URL
    let pagePath = '/unknown';
    try {
      pagePath = new URL(serverData.session.url).pathname;
    } catch (e) {
      console.warn('Invalid URL in performance data:', serverData.session.url);
    }

    // Log to console
    console.log('Performance Data Received:', {
      sessionId: serverData.session.sessionId,
      location: `${serverData.session.location?.city}, ${serverData.session.location?.region}`,
      totalTime: `${serverData.session.totalTime.toFixed(2)}ms`,
      connection: serverData.session.connection?.effectiveType,
      metricsCount: serverData.session.metricsCount,
      url: serverData.session.url,
      page: pagePath,
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

    return NextResponse.json({
      success: true,
      message: 'Performance data received',
      sessionId: serverData.session.sessionId,
    }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      }
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
