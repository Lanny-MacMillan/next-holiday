import { NextResponse } from 'next/server';

export async function GET() {
  // Log environment variables (server-side only, won't expose to client)
  console.log('=== ENVIRONMENT VARIABLES CHECK ===');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log(
    'DATABASE_URL preview:',
    process.env.DATABASE_URL?.substring(0, 20) + '...',
  );
  console.log('AUTH0_SECRET exists:', !!process.env.AUTH0_SECRET);
  console.log('AUTH0_BASE_URL:', process.env.AUTH0_BASE_URL);
  console.log('AUTH0_ISSUER_BASE_URL:', process.env.AUTH0_ISSUER_BASE_URL);
  console.log('AUTH0_CLIENT_ID exists:', !!process.env.AUTH0_CLIENT_ID);
  console.log('AUTH0_CLIENT_SECRET exists:', !!process.env.AUTH0_CLIENT_SECRET);
  console.log('NODE_ENV:', process.env.NODE_ENV);
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
  });
}
