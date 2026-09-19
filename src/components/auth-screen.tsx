'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, Sparkles } from 'lucide-react';
import { initiateEmailSignIn, initiateEmailSignUp, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME, LOGO_SRC } from '@/lib/constants';

/** Traduce los códigos de Firebase Auth a mensajes que el usuario entienda. */
function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado. Prueba a iniciar sesión.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado corta (mínimo 6 caracteres).';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera unos minutos antes de volver a probar.';
    case 'auth/network-request-failed':
      return 'No hay conexión con el servidor. Comprueba tu red.';
    default:
      return 'No se ha podido completar la operación. Inténtalo de nuevo.';
  }
}

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (mode: Mode) => async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await initiateEmailSignIn(auth, email, password);
      } else {
        await initiateEmailSignUp(auth, email, password);
      }
      // Si va bien, `onAuthStateChanged` desmonta esta pantalla.
    } catch (error) {
      // Dejamos de cargar sólo en el caso de error: así el botón no parpadea
      // habilitándose justo antes de que la pantalla desaparezca.
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: mode === 'login' ? 'Error de acceso' : 'Error de registro',
        description: authErrorMessage((error as { code?: string }).code),
      });
    }
  };

  const fields = (idPrefix: string, autoComplete: string) => (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          placeholder="nombre@ejemplo.com"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-password`}>Contraseña</Label>
        <Input
          id={`${idPrefix}-password`}
          type="password"
          autoComplete={autoComplete}
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
        />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md border-border/40 shadow-2xl">
        <CardHeader className="flex flex-col items-center space-y-1">
          <div className="mb-4 rounded-2xl bg-primary/10 p-3">
            <Image src={LOGO_SRC} alt="" width={64} height={64} className="rounded-xl shadow-sm" priority />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">{APP_NAME}</CardTitle>
          <CardDescription>Tu biblioteca personal de prompts en la nube</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-8 grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={submit('login')} className="space-y-4">
                {fields('login', 'current-password')}
                <Button className="mt-6 w-full" type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Iniciar sesión
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={submit('register')} className="space-y-4">
                {fields('register', 'new-password')}
                <Button className="mt-6 w-full" type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col rounded-b-lg border-t bg-muted/10 pt-6">
          <p className="flex items-center gap-1 text-center text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Tus prompts se sincronizarán en todos tus dispositivos
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
