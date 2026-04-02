import type { Metadata } from 'next';
import { validateEnv } from '@/lib/env';
import './globals.css';

validateEnv();

export const metadata: Metadata = {
  title: 'BuddyScript',
  description: 'A social media platform for developers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
