import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/components/providers/auth-provider';
import { SystemAccessAgreementGate } from '@/components/auth/system-access-agreement-gate';
import { ContractorDataProvider } from '@/components/providers/contractor-data-provider';
import { ProviderErrorBoundary } from '@/components/providers/provider-error-boundary';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CROSSUB Maintenance',
  description:
    'Mobile-first maintenance app for repair suppliers and contractors — connected to CROSSUB tenant and agent portals.',
  applicationName: 'CROSSUB Maintenance',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CROSSUB Maintenance',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ProviderErrorBoundary>
            <SystemAccessAgreementGate>
              <ContractorDataProvider>{children}</ContractorDataProvider>
            </SystemAccessAgreementGate>
          </ProviderErrorBoundary>
        </AuthProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
