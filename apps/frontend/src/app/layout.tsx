import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GrantsMaster - Grant Management Platform',
  description: 'Internal grant management platform for WebSlingerAI',
  manifest: '/branding/favicon/site.webmanifest',
  icons: {
    icon: [
      { url: '/branding/favicon/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/branding/favicon/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/branding/favicon/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/branding/favicon/favicon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/branding/favicon/favicon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/branding/favicon/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/branding/favicon/favicon-256.png', sizes: '256x256', type: 'image/png' },
      { url: '/branding/favicon/favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/branding/favicon/favicon-32.png',
    apple: '/branding/favicon/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
