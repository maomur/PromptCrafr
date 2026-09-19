'use client';

import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useInstallPrompt } from '@/features/pwa/hooks/use-install-prompt';
import { APP_NAME } from '@/lib/constants';

/**
 * Invitación a instalar la aplicación.
 *
 * Es un aviso al pie y **no un diálogo modal**. Antes lo era, y en producción
 * —donde el navegador sí ofrece instalar— se abría con velo encima de la
 * biblioteca en la primera visita, bloqueando la aplicación entera antes de
 * que el usuario hubiera visto nada. Pedir permiso para instalar algo que
 * todavía no se ha usado, y además impedir usarlo, era justo lo contrario de
 * lo que se pretendía.
 *
 * Va abajo a la izquierda y por encima de la papelera, para no taparse
 * con ella ni con los botones de crear.
 */
export default function InstallBanner() {
  const { isVisible, isIOS, canInstall, install, snooze } = useInstallPrompt();

  if (!isVisible) return null;

  return (
    <Card
      role="complementary"
      aria-label={`Instalar ${APP_NAME}`}
      className="fixed bottom-28 left-4 z-30 w-[min(22rem,calc(100vw-2rem))] p-4 shadow-2xl animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Download className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold">Instalar {APP_NAME}</p>

          {isIOS ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Toca <Share className="mb-0.5 inline h-3 w-3" /> <strong>Compartir</strong> en Safari
              y luego <strong>Añadir a pantalla de inicio</strong>.
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Ábrela desde tu escritorio, a pantalla completa y sin conexión.
            </p>
          )}

          {canInstall && (
            <Button size="sm" onClick={() => void install()}>
              Instalar
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="-mr-1 -mt-1 h-7 w-7 shrink-0"
          onClick={snooze}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Ahora no</span>
        </Button>
      </div>
    </Card>
  );
}
