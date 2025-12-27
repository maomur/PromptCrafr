import { Button } from './ui/button';
import { Plus, Lightbulb } from 'lucide-react';

// NOTA: El botón 'Crea tu primer prompt' aquí es para efecto visual.
// El verdadero disparador del diálogo está en el encabezado para mantener una estructura de componentes limpia.
export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 mt-12 rounded-lg border-2 border-dashed">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
          <Lightbulb className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      <h2 className="text-2xl font-semibold font-headline">Tu Biblioteca de Prompts está vacía</h2>
      <p className="mt-2 text-muted-foreground max-w-md mx-auto">
        Parece que aún no has creado ningún prompt. Empieza creando el primero.
      </p>
      <div className="mt-6">
        <Button disabled variant="outline">
          <Plus className="-ml-1 h-4 w-4" />
          Crea Tu Primer Prompt
        </Button>
      </div>
    </div>
  );
}
