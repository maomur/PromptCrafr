'use client';

import { useState } from 'react';
import { useAuth, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function AuthScreen() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    initiateEmailSignIn(auth, email, password).catch((error: any) => {
      setIsLoading(false);
      // El error se maneja silenciosamente en la consola para evitar el overlay de Next.js
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description: "Credenciales inválidas. Por favor, verifica tu correo y contraseña.",
      });
    });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    initiateEmailSignUp(auth, email, password).catch((error: any) => {
      setIsLoading(false);
      let message = "No se pudo crear la cuenta.";
      if (error.code === 'auth/email-already-in-use') {
        message = "Este correo ya está registrado.";
      } else if (error.code === 'auth/weak-password') {
        message = "La contraseña es muy débil (mínimo 6 caracteres).";
      }
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: message,
      });
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl border-border/40">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="mb-4 p-3 bg-primary/10 rounded-2xl">
            <Image 
              src="https://www.pulseai.ws/logo193.png" 
              alt="Logo" 
              width={64} 
              height={64} 
              className="rounded-xl shadow-sm"
            />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">PromptCraft</CardTitle>
          <CardDescription>
            Tu biblioteca personal de prompts en la nube
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="nombre@ejemplo.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button className="w-full mt-6" type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="nombre@ejemplo.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button className="w-full mt-6" type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col border-t pt-6 bg-muted/10 rounded-b-lg">
          <p className="text-xs text-center text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            Tus prompts se sincronizarán en todos tus dispositivos
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
