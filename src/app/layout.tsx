import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import '@/styles/globals.css';

import { Toaster } from '@/components/ui/toaster';
import InstallBanner from '@/features/pwa/components/install-banner';
import ServiceWorkerRegistrar from '@/features/pwa/components/service-worker-registrar';
import { APP_DESCRIPTION, APP_NAME, BRAND_COLOR } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: { capable: true, statusBarStyle: 'default', title: APP_NAME },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: BRAND_COLOR,
  width: 'device-width',
  initialScale: 1,
  // Sin `maximumScale` ni `userScalable`: bloquear el zoom impide leer a quien
  // lo necesita y iOS lo ignora desde hace varias versiones.
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={cn(GeistSans.variable, GeistMono.variable)}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <div className="flex-grow">{children}</div>
        <InstallBanner />
        <Toaster />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
