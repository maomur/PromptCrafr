import { Loader2 } from 'lucide-react';

/** Se muestra mientras la ruta se prepara. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  );
}
