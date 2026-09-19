'use client';

import { Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInstallPrompt } from '@/features/pwa/hooks/use-install-prompt';
import { APP_NAME } from '@/lib/constants';

/**
 * Invitación a instalar la aplicación.
 *
 * Sólo se ocupa de pintar: cuándo aparece, si el navegador admite la
 * instalación automática y el recordatorio pospuesto los decide
 * `useInstallPrompt`.
 */
export default function InstallBanner() {
  const { isVisible, isIOS, canInstall, install, snooze } = useInstallPrompt();

  if (!isVisible) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && snooze()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Instalar {APP_NAME}
          </DialogTitle>
          <DialogDescription>
            {isIOS
              ? 'Para una mejor experiencia, añade esta aplicación a tu pantalla de inicio.'
              : 'Instálala para abrirla desde tu escritorio o menú de inicio.'}
          </DialogDescription>
        </DialogHeader>

        {isIOS ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 rounded-lg bg-muted p-3 text-sm">
              <div className="rounded bg-background p-1 shadow-sm">1</div>
              <p>
                Toca el botón <strong>Compartir</strong>{' '}
                <Share className="mb-1 inline h-4 w-4" /> en la barra inferior de Safari.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-muted p-3 text-sm">
              <div className="rounded bg-background p-1 shadow-sm">2</div>
              <p>
                Desliza y selecciona <strong>Añadir a pantalla de inicio</strong>.
              </p>
            </div>
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            Se abrirá a pantalla completa y seguirá funcionando sin conexión.
          </p>
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {canInstall && (
            <Button onClick={() => void install()} className="w-full sm:w-auto">
              Instalar ahora
            </Button>
          )}
          <Button variant="outline" onClick={snooze} className="w-full sm:w-auto">
            {isIOS ? 'Entendido' : 'Más tarde'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
