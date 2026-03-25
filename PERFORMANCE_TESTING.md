# Performance Testing Guide for Next Holiday App

## Overview

This guide helps you and your testers collect real-world performance data from different locations across the US to analyze how fast the live app loads and runs for users in different geographic areas.

## For Testers: How to Help

### 1. Access the Live App

- Visit the deployed Next Holiday app at [your-app-url.com]
- The app will automatically start collecting performance metrics in the background
- Look for a 📊 button in the bottom-right corner to view detailed performance data

### 2. Key Information We're Collecting

- **Your Location**: City, region, and timezone (automatically detected from your IP)
- **Connection Speed**: Your internet connection type and speed
- **Loading Times**: How fast the app loads and responds in your area
- **Web Vitals**: Core user experience metrics (LCP, FID, CLS, etc.)

### 3. What to Test

1. **Fresh Page Load**: Visit the app with a clear cache to test cold loading
2. **Navigation**: Click through different holiday sections (Christmas, Birthday, etc.)
3. **Interactive Features**: Try creating/editing holiday items and forms
4. **Multiple Visits**: Test at different times of day to see consistency

### 4. Viewing & Sharing Results

The app automatically sends performance data to the server, but you can also:

- **Click the 📊 button** to see real-time performance metrics for your location
- **Click "Log to Console"** to see detailed metrics (open browser dev tools first)
- **Click "Export JSON"** to download detailed data you can share
- **Click "Export CSV"** to download data for spreadsheet analysis

**Note**: Your location and performance data helps improve the app experience for all users!

## For Developer: Monitoring Live App Performance

### 1. Real-time Data Collection

Monitor your AWS Amplify app logs for performance data:

```bash
# Check AWS CloudWatch logs or Amplify console for:
# 🚀 Performance Data Received
# 📊 Detailed Metrics
# 💯 Web Vitals from different locations
```

### 2. Key Metrics to Watch

#### Core Web Vitals

- **LCP (Largest Contentful Paint)**: Good < 2.5s, Poor > 4s
- **FID (First Input Delay)**: Good < 100ms, Poor > 300ms
- **CLS (Cumulative Layout Shift)**: Good < 0.1, Poor > 0.25

#### Loading Performance

- **DNS_TIME**: DNS lookup duration
- **TCP_TIME**: Connection establishment
- **REQUEST_TIME**: Time to first byte
- **RESPONSE_TIME**: Download time
- **DOM_PROCESSING**: DOM parsing and rendering
- **TOTAL_TIME**: Complete page load

#### Geographic Patterns

- Compare metrics by city/region
- Identify slower regions
- Analyze connection type impact

### 3. AWS Amplify Integration

Since you're using AWS Amplify, you can enhance monitoring with:

#### CloudWatch Logs

Add this to your `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
# Add custom headers for performance monitoring
customHeaders:
  - pattern: '**'
    headers:
      - key: 'Timing-Allow-Origin'
        value: '*'
```

#### Environment Variables

Set these in Amplify Console for production monitoring:

```
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ANALYTICS_ENDPOINT=your-analytics-endpoint
```

### 4. Production Setup

For production monitoring, you can:

1. **Enable Performance API**: Update the API to store data in DynamoDB
2. **CloudWatch Metrics**: Send metrics to CloudWatch for dashboards
3. **Real User Monitoring**: Use AWS X-Ray or third-party services
4. **Geographic Analysis**: Use CloudFront logs for location data

### 5. Sample Analysis Queries

Once you have data, analyze patterns:

```javascript
// Group by location
const byLocation = metrics.reduce((acc, metric) => {
  const key = `${metric.location.city}, ${metric.location.region}`;
  if (!acc[key]) acc[key] = [];
  acc[key].push(metric);
  return acc;
}, {});

// Calculate averages by location
Object.entries(byLocation).forEach(([location, metrics]) => {
  const avgLoadTime =
    metrics
      .filter(m => m.name === 'TOTAL_TIME')
      .reduce((sum, m) => sum + m.value, 0) / metrics.length;

  console.log(`${location}: ${avgLoadTime.toFixed(0)}ms average load time`);
});
```

### 6. What Good Performance Looks Like

When analyzing results from different locations:

### Common Issues

1. **Dashboard button not visible**: Refresh the page and wait a few seconds for the app to load
2. **No location data**: Check if browser blocks location services or try a different browser
3. **Missing metrics**: Ensure JavaScript is enabled and the page fully loads
4. **Slow performance**: This is valuable data! Different locations will have different speeds

### Tips for Testers

- Test with different browsers (Chrome, Safari, Firefox, Edge)
- Try both WiFi and mobile data connections if possible
- Test at different times of day to see if performance varies
- Clear browser cache between tests for accurate "first visit" measurements
- Note your approximate location when sharing results

## Expected Results

Good performance targets:

**Target Performance Metrics:**

- **Total Load Time**: < 3 seconds (excellent), < 5 seconds (acceptable)
- **LCP (Largest Contentful Paint)**: < 2.5 seconds (good), < 4 seconds (acceptable)
- **FID (First Input Delay)**: < 100ms (good), < 300ms (acceptable)
- **CLS (Cumulative Layout Shift)**: < 0.1 (good), < 0.25 (acceptable)

**Geographic Variations:**

- **Some variation is normal** - West Coast vs East Coast may differ by 100-500ms
- **Significant differences (>2x)** may indicate areas for optimization:
  - CDN optimization opportunities
  - Image/asset optimization needs
  - Code splitting requirements
  - Server-side rendering improvements

**Connection Type Impact:**

- **4G/5G Mobile**: Should be comparable to WiFi
- **3G Mobile**: May be 2-3x slower, but still usable
- **Satellite/Rural**: May show higher latency but consistent speeds
