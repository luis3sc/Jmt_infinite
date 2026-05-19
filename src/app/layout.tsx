import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import AuthButton from '@/components/layout/AuthButton';

import HeaderWrapper from '@/components/layout/HeaderWrapper';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

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
    <html lang="es" className={`${roboto.variable}`}>
      <body className="font-sans min-h-[100dvh] relative">
        <HeaderWrapper>
          <AuthButton />
        </HeaderWrapper>
        {children}
      </body>
    </html>
  );
}

