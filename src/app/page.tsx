'use client';

import PromptPage from '@/components/prompt-page';
import AuthScreen from '@/components/auth-screen';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <Image 
              src="https://www.pulseai.ws/logo192.png" 
              alt="PromptCraft Logo" 
              width={120} 
              height={120} 
              className="relative rounded-3xl shadow-2xl"
              priority
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">PromptCraft</h1>
            <div className="flex items-center gap-2 text-muted-foreground font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="animate-pulse">Iniciando biblioteca...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Garantizamos que el usuario existe antes de renderizar PromptPage
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <PromptPage user={user} />
    </main>
  );
}
