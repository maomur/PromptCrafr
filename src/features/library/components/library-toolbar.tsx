'use client';

import { useEffect, useRef } from 'react';
import { Download, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { promptCategories } from '@/features/library/types';

interface LibraryToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  /** Etiqueta del valor «todas» del desplegable de categorías. */
  allCategoriesLabel: string;
  /** Número de recursos que se están mostrando, para anunciarlo al buscar. */
  resultCount: number;
  /** Descarga todos los prompts en un CSV. */
  onExport: () => void;
  /** Cuántos prompts se exportarían; a cero, el botón no tiene sentido. */
  exportCount: number;
}

export default function LibraryToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  allCategoriesLabel,
  resultCount,
  onExport,
  exportCount,
}: LibraryToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajo de teclado: "/" enfoca el buscador, como en GitHub o Gmail.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;

      // No robamos la tecla mientras se escribe en otro campo.
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && query) {
              event.preventDefault();
              onQueryChange('');
            }
          }}
          placeholder="Buscar en títulos, descripciones y contenido..."
          aria-label="Buscar en la biblioteca"
          className="pl-9 pr-9"
        />

        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => {
              onQueryChange('');
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Borrar la búsqueda</span>
          </Button>
        ) : (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:block">
            /
          </kbd>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[190px]" aria-label="Filtrar por categoría">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value={allCategoriesLabel}>Todas las categorías</SelectItem>
          {promptCategories.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
        </Select>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 md:h-9 md:w-9"
                onClick={onExport}
                disabled={exportCount === 0}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Exportar los prompts a CSV</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {exportCount === 0
                ? 'No hay prompts que exportar'
                : `Exportar ${exportCount === 1 ? 'el prompt' : `los ${exportCount} prompts`} a CSV`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Los lectores de pantalla no ven que la lista se ha encogido, así que
          se lo contamos. */}
      <p aria-live="polite" className="sr-only">
        {query ? `${resultCount} resultados para ${query}` : ''}
      </p>
    </div>
  );
}
