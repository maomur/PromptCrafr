import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import InstallPWABanner from '@/components/install-pwa-banner';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { APP_DESCRIPTION, APP_NAME, BRAND_COLOR } from '@/lib/constants';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: BRAND_COLOR,
  width: 'device-width',
  initialScale: 1,
  // Sin `maximumScale` ni `userScalable`: bloquear el zoom impide leer a quien
  // lo necesita y iOS lo ignora desde hace varias versiones.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(GeistSans.variable, GeistMono.variable)}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <FirebaseClientProvider>
          <div className="flex-grow">{children}</div>
          <InstallPWABanner />
          <Toaster />
          <footer className="py-6 text-center text-sm text-muted-foreground">
            Creado por:{' '}
            <a
              href="https://www.linkedin.com/in/maomur"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 hover:text-primary"
            >
              Maomur
            </a>
          </footer>
        </FirebaseClientProvider>

        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
