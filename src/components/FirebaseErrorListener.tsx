'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente invisible que escucha los rechazos de las reglas de seguridad de
 * Firestore.
 *
 * En desarrollo relanza el error para que aparezca en el overlay de Next.js con
 * el detalle de la petición denegada. En producción eso tumbaría la aplicación
 * entera por un fallo que casi siempre es recuperable, así que allí avisamos al
 * usuario con un toast y registramos el error en la consola.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (permissionError: FirestorePermissionError) => {
      if (process.env.NODE_ENV === 'development') {
        setError(permissionError);
        return;
      }

      console.error(permissionError);
      toast({
        variant: 'destructive',
        title: 'Permiso denegado',
        description: 'No se ha podido completar la operación. Vuelve a iniciar sesión e inténtalo de nuevo.',
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, [toast]);

  if (error) throw error;

  return null;
}
