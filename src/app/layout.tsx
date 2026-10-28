import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/store/provider';
import Auth0ProviderWrapper from '@/components/auth/Auth0Provider';
import AppContent from '@/components/AppContent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.next-holiday.com'),
  title: 'Next Holiday',
  description: 'Plan your holidays with ease',
  authors: [{ name: 'Lanny MacMillan' }],
  other: {
    'article:author': 'Lanny MacMillan',
    'article:published_time': '2026-10-28T00:00:00Z',
  },
  openGraph: {
    title: 'Next Holiday',
    description: 'Plan your holidays with ease',
    url: '/',
    siteName: 'Next Holiday',
    type: 'website',
    images: [
      {
        url: '/nextHolidayHero.png',
        width: 2400,
        height: 1200,
        alt: 'Next Holiday - collaborative holiday planning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next Holiday',
    description: 'Plan your holidays with ease',
    images: ['/nextHolidayHero.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-side env check (only logs on server, not exposed to client)
  if (typeof window === 'undefined') {
    console.log('Layout render - DB configured:', !!process.env.DATABASE_URL);
  }

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap"
          rel="stylesheet"
        />
        {/* Umami Analytics */}
        <script
          defer
          src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
        />
        {/* Eruda mobile console - for debugging */}
        {/* <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script dangerouslySetInnerHTML={{ __html: 'eruda.init();' }} /> */}
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
