'use client';

import { FilterX, Lightbulb, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** `true` si la biblioteca tiene contenido pero los filtros activos lo ocultan. */
  isFiltered: boolean;
  /** Texto buscado, si lo hay, para poder citarlo en el mensaje. */
  searchQuery: string;
  onCreatePrompt: () => void;
  onClearFilters: () => void;
}

export default function EmptyState({
  isFiltered,
  searchQuery,
  onCreatePrompt,
  onClearFilters,
}: EmptyStateProps) {
  const isSearching = searchQuery.trim().length > 0;
  return (
    <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        {isFiltered || isSearching ? (
          <FilterX className="h-8 w-8 text-muted-foreground" />
        ) : (
          <Lightbulb className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <h2 className="text-2xl font-semibold">
        {isSearching
          ? `Sin resultados para «${searchQuery.trim()}»`
          : isFiltered
            ? 'Ningún recurso coincide'
            : 'Tu biblioteca está vacía'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        {isSearching
          ? 'No hay ningún prompt ni enlace con ese texto en su título, descripción o contenido.'
          : isFiltered
            ? 'No hay prompts ni enlaces que encajen con los filtros activos. Prueba a quitarlos para ver todo lo que tienes guardado.'
            : 'Aún no has guardado nada. Empieza creando tu primer prompt o guardando un enlace de interés.'}
      </p>

      <div className="mt-6">
        {isFiltered || isSearching ? (
          <Button variant="outline" onClick={onClearFilters}>
            <FilterX className="mr-2 h-4 w-4" />
            Quitar filtros y búsqueda
          </Button>
        ) : (
          <Button onClick={onCreatePrompt}>
            <Plus className="mr-2 h-4 w-4" />
            Crear mi primer prompt
          </Button>
        )}
      </div>
    </div>
  );
}
