import React from 'react';
import TopBar from '@/components/layout/TopBar';
import AuthButton from '@/components/layout/AuthButton';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar isFixed={true} right={<AuthButton />} />
      {children}
    </>
  );
}
