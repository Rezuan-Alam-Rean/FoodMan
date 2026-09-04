// root application layout with Google Sans typography and query provider
import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthSplashProvider } from '@/components/providers/auth-splash-provider';
import { NotificationProvider } from '@/components/providers/notification-provider';

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
      className={`${fontMono.variable} h-full antialiased light`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Google+Sans+Text:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap"
          rel="stylesheet"
        />
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

