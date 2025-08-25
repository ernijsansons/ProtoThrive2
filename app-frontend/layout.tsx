import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DevCommand - AI-First Development Platform',
  description: 'Transform your development workflow with visual roadmaps, AI automation, and predictive insights',
  keywords: ['development', 'AI', 'automation', 'visual programming', 'no-code'],
  authors: [{ name: 'DevCommand Team' }],
  openGraph: {
    title: 'DevCommand - AI-First Development Platform',
    description: 'Transform your development workflow with visual roadmaps, AI automation, and predictive insights',
    url: 'https://devcommand.com',
    siteName: 'DevCommand',
    images: [
      {
        url: 'https://devcommand.com/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevCommand - AI-First Development Platform',
    description: 'Transform your development workflow with visual roadmaps, AI automation, and predictive insights',
    images: ['https://devcommand.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#0A0E27" />
        </head>
        <body className={`${inter.className} min-h-screen bg-background antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}