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

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // Inicialización de SortableJS con técnica de reversión de DOM para React
    const sortable = new Sortable(el, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      forceFallback: true,
      onEnd: (evt) => {
        const { oldIndex, newIndex, item, from } = evt;
        
        /**
         * REVERSIÓN ATÓMICA:
         * SortableJS manipula el DOM real. Devolvemos el nodo a su posición original
         * antes de que React procese el cambio de estado. Esto evita errores de 
         * desincronización de nodos (NotFoundError) al eliminar elementos.
         */
        if (from && item) {
          try {
            const nextSibling = from.children[oldIndex!] || null;
            if (nextSibling) {
              from.insertBefore(item, nextSibling);
            } else {
              from.appendChild(item);
            }
          } catch (e) {
            // Error silencioso si el nodo ya no existe
          }
        }
        
        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          onReorder(oldIndex, newIndex);
        }
      },
    });

    sortableRef.current = sortable;

    return () => {
      if (sortableRef.current) {
        try {
          sortableRef.current.destroy();
        } catch (e) {}
        sortableRef.current = null;
      }
    };
  }, []); // Dependencias vacías para mantener una instancia única y estable

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
