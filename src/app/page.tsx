
'use client';

import PromptPage from '@/components/prompt-page';
import AuthScreen from '@/components/auth-screen';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Cargando PromptCraft...</p>
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
