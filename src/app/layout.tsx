import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import AuthButton from '@/components/layout/AuthButton';

import HeaderWrapper from '@/components/layout/HeaderWrapper';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'JMT Marketplace',
  description: 'Digital Out Of Home Advertising Marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${outfit.variable}`}>
      <body className="font-sans min-h-[100dvh] relative">
        <HeaderWrapper>
          <AuthButton />
        </HeaderWrapper>
        {children}
      </body>
    </html>
  );
}

