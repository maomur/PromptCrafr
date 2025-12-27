import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

// NOTA: El botón 'Crea tu primer prompt' aquí es para efecto visual.
// El verdadero disparador del diálogo está en el encabezado para mantener una estructura de componentes limpia.
export default function EmptyState() {
  const emptyStateImage = PlaceHolderImages.find(img => img.id === 'empty-state-1');

  return (
    <div className="relative flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-border mt-12 overflow-hidden">
        {emptyStateImage && (
            <Image
                src={emptyStateImage.imageUrl}
                alt={emptyStateImage.description}
                data-ai-hint={emptyStateImage.imageHint}
                fill
                className="object-cover opacity-10 dark:opacity-5"
            />
        )}
      <div className="relative z-10">
        <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb text-primary"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            </div>
        </div>
        <h2 className="text-2xl font-bold font-headline">Tu Biblioteca de Prompts está vacía</h2>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Parece que aún no has creado ningún prompt. Empieza creando el primero.
        </p>
        <div className="mt-6">
          <Button disabled>
            <Plus className="-ml-1 h-4 w-4" />
            Crea Tu Primer Prompt
          </Button>
        </div>
      </div>
    </div>
  );
}
