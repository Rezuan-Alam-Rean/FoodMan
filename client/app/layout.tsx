// root application layout with self-hosted typography and query provider
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthSplashProvider } from '@/components/providers/auth-splash-provider';
import { NotificationProvider } from '@/components/providers/notification-provider';

const fontSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const fontMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF4B6E',
};

export const metadata: Metadata = {
  title: 'FoodMan — Food Delivery in Bangladesh',
  description: 'Order authentic feast, biryani, burgers, and delicious dishes from top restaurants with fixed zone delivery fees in Dhaka.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased light`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ws-ap2.pusher.com" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8F9FA] text-slate-900 font-sans" suppressHydrationWarning>
        <QueryProvider>
          <AuthSplashProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthSplashProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

