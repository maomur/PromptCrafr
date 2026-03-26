'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function InstallPWABanner() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada o en modo standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Manejar evento de instalación en Android/Windows
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // En iOS, sugerir instalación después de unos segundos
    if (isAppleDevice) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setShowBanner(false);
    }
  };

  if (!showBanner) return null;

  return (
    <Dialog open={showBanner} onOpenChange={setShowBanner}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Instalar PromptCraft
          </DialogTitle>
          <DialogDescription>
            {isIOS 
              ? "Para una mejor experiencia, añade esta aplicación a tu pantalla de inicio." 
              : "Instala nuestra aplicación para acceder rápidamente desde tu escritorio o menú de inicio."}
          </DialogDescription>
        </DialogHeader>

        {isIOS ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 bg-muted p-3 rounded-lg text-sm">
              <div className="bg-background p-1 rounded shadow-sm">1</div>
              <p>Toca el botón <strong>Compartir</strong> <Share className="inline h-4 w-4 mb-1" /> en la barra inferior de Safari.</p>
            </div>
            <div className="flex items-start gap-3 bg-muted p-3 rounded-lg text-sm">
              <div className="bg-background p-1 rounded shadow-sm">2</div>
              <p>Desliza hacia abajo y selecciona <strong>Añadir a pantalla de inicio</strong>.</p>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Obtendrás una experiencia a pantalla completa y acceso sin conexión mejorado.
            </p>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {!isIOS && (
            <Button onClick={handleInstallClick} className="w-full sm:w-auto">
              Instalar ahora
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowBanner(false)} className="w-full sm:w-auto">
            {isIOS ? "Entendido" : "Más tarde"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
