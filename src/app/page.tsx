'use client';

import { Loader2 } from 'lucide-react';
import AuthScreen from '@/components/auth-screen';
import PromptPage from '@/components/prompt-page';
import { useUser } from '@/firebase';
import Logo from '@/components/logo';
import { APP_NAME } from '@/lib/constants';

export default function Home() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex animate-in flex-col items-center gap-6 fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 scale-150 animate-pulse rounded-full bg-primary/20 blur-3xl" />
            <Logo size={120} className="relative rounded-[28px] shadow-2xl" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{APP_NAME}</h1>
            <div className="flex items-center gap-2 font-medium text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              <p>Iniciando biblioteca...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <PromptPage user={user} />
    </main>
  );
}
