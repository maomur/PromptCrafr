'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StorageAlertProps {
  error: Error | null;
}

/**
 * Aviso de que el navegador no deja guardar.
 *
 * Sin servidor, si IndexedDB falla —navegación privada, almacenamiento
 * bloqueado, cuota agotada— la aplicación parece funcionar: se escriben
 * prompts, aparecen en pantalla y desaparecen al recargar. Callarlo era la
 * peor clase de fallo, así que se avisa en cuanto ocurre y de forma
 * permanente, no con un toast que se va solo.
 */
export default function StorageAlert({ error }: StorageAlertProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>No se puede guardar en este navegador</AlertTitle>
      <AlertDescription className="space-y-1">
        <p>
          Lo que escribas se verá en pantalla pero <strong>se perderá al recargar</strong>. Suele
          pasar en ventanas privadas o con el almacenamiento del sitio bloqueado.
        </p>
        <p>
          Descarga una copia desde el menú de la cabecera antes de cerrar, y abre la aplicación en
          una ventana normal.
        </p>
      </AlertDescription>
    </Alert>
  );
}
