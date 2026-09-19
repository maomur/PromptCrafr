'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Última red de seguridad de la ruta.
 *
 * Tiene que ser un componente de cliente: React necesita poder reintentar el
 * render desde el navegador. Sin esto, cualquier excepción dejaba la página en
 * blanco sin explicación y sin forma de recuperarse salvo recargar.
 *
 * No ofrece «volver a intentarlo» sobre los datos porque los datos están en el
 * navegador: si algo falla aquí, es el propio render.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h1 className="text-2xl font-semibold">Algo ha fallado</h1>
      <p className="text-muted-foreground">
        No se ha podido mostrar la biblioteca. Tus prompts siguen guardados en este navegador: no
        se ha perdido nada.
      </p>

      <Button onClick={reset}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}
