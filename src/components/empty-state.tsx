'use client';

import { Button } from './ui/button';
import { Plus, Lightbulb } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 mt-12 rounded-lg border-2 border-dashed">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
          <Lightbulb className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      <h2 className="text-2xl font-semibold font-headline">Tu Biblioteca de Recursos está vacía</h2>
      <p className="mt-2 text-muted-foreground max-w-md mx-auto">
        Parece que aún no has guardado nada. Empieza creando tu primer prompt o guardando un enlace de interés.
      </p>
      <div className="mt-6">
        <Button disabled variant="outline">
          <Plus className="-ml-1 h-4 w-4" />
          Crea Tu Primer Recurso
        </Button>
      </div>
    </div>
  );
}
