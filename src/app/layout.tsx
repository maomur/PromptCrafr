import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'PromptCraft',
  description: 'Gestiona tus prompts creativos con facilidad.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(GeistSans.variable, GeistMono.variable)}>
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <div className="flex-grow">{children}</div>
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
      </body>
    </html>
  );
}
