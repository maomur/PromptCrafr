'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { promptCategories } from '@/lib/definitions';

interface LibraryToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  /** Etiqueta del valor «todas» del desplegable de categorías. */
  allCategoriesLabel: string;
  /** Número de recursos que se están mostrando, para anunciarlo al buscar. */
  resultCount: number;
}

export default function LibraryToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  allCategoriesLabel,
  resultCount,
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

      {/* Los lectores de pantalla no ven que la lista se ha encogido, así que
          se lo contamos. */}
      <p aria-live="polite" className="sr-only">
        {query ? `${resultCount} resultados para ${query}` : ''}
      </p>
    </div>
  );
}
