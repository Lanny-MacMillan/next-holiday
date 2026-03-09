import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('=== DATABASE CONNECTION TEST ===');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test if users table exists and get count
    const userCount = await prisma.user.count();
    console.log('✅ Users table accessible, count:', userCount);

    // Test if accounts table exists
    const accountCount = await prisma.account.count();
    console.log('✅ Accounts table accessible, count:', accountCount);

    // Test if holidays table exists
    const holidayCount = await prisma.holiday.count();
    console.log('✅ Holidays table accessible, count:', holidayCount);

    await prisma.$disconnect();

    return NextResponse.json({
      status: 'Database connection successful',
      tables: {
        users: userCount,
        accounts: accountCount,
        holidays: holidayCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Database connection failed:', error);

    return NextResponse.json(
      {
        status: 'Database connection failed',
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
