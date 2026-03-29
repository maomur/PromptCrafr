'use client';

import { useEffect, useRef, memo } from 'react';
import type { Prompt, Project } from '@/lib/definitions';
import PromptCard from '@/components/prompt-card';
import Sortable from 'sortablejs';

interface PromptListProps {
  prompts: Prompt[];
  projects: Project[];
  onDeletePrompt: (id: string) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onMoveToProject: (promptId: string, projectId: string | null) => void;
}

const PromptList = memo(function PromptList({ 
  prompts, 
  projects,
  onDeletePrompt, 
  onEditPrompt, 
  onReorder,
  onMoveToProject
}: PromptListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);
  
  // Usamos una ref para el callback de reordenamiento para evitar que el useEffect dependa de él.
  // Esto mantiene la instancia de SortableJS estable incluso si la función cambia.
  const onReorderRef = useRef(onReorder);
  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // Inicialización estática de SortableJS. 
    // Las dependencias vacías [] son cruciales para evitar conflictos de DOM con React.
    const sortable = new Sortable(el, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      forceFallback: true,
      fallbackOnBody: true,
      delay: 150,
      delayOnTouchOnly: true,
      onStart: (evt) => {
        // Guardamos la posición original exacta para la reversión atómica
        (evt.item as any)._originalNextSibling = evt.item.nextSibling;
      },
      onEnd: (evt) => {
        const { item, from, oldIndex, newIndex } = evt;
        
        // REVERSIÓN ATÓMICA: Devolvemos el nodo a su sitio original inmediatamente.
        // Esto previene el error 'removeChild' de React al mantener el DOM coherente.
        if (from && item) {
          try {
            const nextSibling = (item as any)._originalNextSibling;
            from.insertBefore(item, nextSibling || null);
          } catch (e) {
            // Ignorar errores si el nodo ya ha sido manipulado por un borrado concurrente
          }
        }

        // Ejecutamos la lógica de negocio (cambio de orden en DB) tras restaurar el DOM
        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          setTimeout(() => {
            onReorderRef.current(oldIndex, newIndex);
          }, 0);
        }
      },
    });

    sortableRef.current = sortable;

    return () => {
      // Limpieza defensiva
      if (sortableRef.current) {
        try {
          if (el && document.contains(el)) {
            sortableRef.current.destroy();
          }
        } catch (e) {
          // Ignorar errores de destrucción si el DOM ya ha sido modificado por React
        }
        sortableRef.current = null;
      }
    };
  }, []); // Dependencias vacías para máxima estabilidad

  if (prompts.length === 0) return null;

  return (
    <div 
      ref={listRef} 
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {prompts.map((prompt) => (
        <div key={prompt.id} data-id={prompt.id} className="h-full">
          <PromptCard 
            prompt={prompt} 
            projects={projects}
            onDelete={onDeletePrompt} 
            onEdit={onEditPrompt}
            onMoveToProject={onMoveToProject}
          />
        </div>
      ))}
    </div>
  );
});

export default PromptList;
