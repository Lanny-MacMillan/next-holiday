import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/store/provider';
import Auth0ProviderWrapper from '@/components/auth/Auth0Provider';
import AppContent from '@/components/AppContent';
import { installFetchTracer } from '@/lib/traceFetch';
import { initPerformanceMonitor } from '@/lib/performance';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next Holiday',
  description: 'Plan your holidays with ease',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-side env check (only logs on server, not exposed to client)
  if (typeof window === 'undefined') {
    console.log('Layout render - DB configured:', !!process.env.DATABASE_URL);
  }

  // Install fetch tracer and performance monitoring on client side
  if (typeof window !== 'undefined') {
    installFetchTracer();
    initPerformanceMonitor();
  }

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <Auth0ProviderWrapper>
          <ReduxProvider>
            <AppContent>{children}</AppContent>
          </ReduxProvider>
        </Auth0ProviderWrapper>
      </body>
    </html>
  );
}
