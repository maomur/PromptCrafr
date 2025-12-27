import type { Metadata } from 'next';
import { Geist_Sans as GeistSans } from 'geist/font/sans';
import { Geist_Mono as GeistMono } from 'geist/font/mono';
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
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
