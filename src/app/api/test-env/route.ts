import { NextResponse } from 'next/server';

export async function GET() {
  // Log environment variables (server-side only, won't expose to client)
  console.log('=== ENVIRONMENT VARIABLES CHECK ===');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('DATABASE_URL value:', process.env.DATABASE_URL ? 'SET' : 'NOT_SET');
  console.log(
    'DATABASE_URL preview:',
    process.env.DATABASE_URL?.substring(0, 20) + '...',
  );
  console.log('AUTH0_SECRET exists:', !!process.env.AUTH0_SECRET);
  console.log('AUTH0_SECRET value:', process.env.AUTH0_SECRET ? 'SET' : 'NOT_SET');
  console.log('AUTH0_BASE_URL:', process.env.AUTH0_BASE_URL);
  console.log('AUTH0_ISSUER_BASE_URL:', process.env.AUTH0_ISSUER_BASE_URL);
  console.log('AUTH0_CLIENT_ID exists:', !!process.env.AUTH0_CLIENT_ID);
  console.log('AUTH0_CLIENT_SECRET exists:', !!process.env.AUTH0_CLIENT_SECRET);
  console.log('NODE_ENV:', process.env.NODE_ENV);

  // Log all env vars that start with AUTH0 or DATABASE
  console.log('All AUTH0/DATABASE env vars:');
  Object.keys(process.env)
    .filter(key => key.startsWith('AUTH0') || key.startsWith('DATABASE'))
    .forEach(key => {
      console.log(`${key}:`, process.env[key] ? 'SET' : 'NOT_SET');
    });
  console.log('================================');

  // Return safe info (no sensitive data)
  return NextResponse.json({
    status: 'Environment check completed',
    databaseConfigured: !!process.env.DATABASE_URL,
    auth0Configured: !!(
      process.env.AUTH0_SECRET &&
      process.env.AUTH0_BASE_URL &&
      process.env.AUTH0_ISSUER_BASE_URL &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET
    ),
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    // Debug info
    envVarsFound: Object.keys(process.env)
      .filter(key => key.startsWith('AUTH0') || key.startsWith('DATABASE'))
      .map(key => ({ name: key, hasValue: !!process.env[key] })),
  });
}
