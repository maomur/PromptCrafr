'use client';

import { useEffect, useRef } from 'react';
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

export default function PromptList({ 
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
    if (!listRef.current) return;

    // Inicialización extremadamente estable de SortableJS
    const sortable = new Sortable(listRef.current, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      forceFallback: true, // Crucial para móviles y para evitar interferencias de sistema
      fallbackOnBody: true,
      onEnd: (evt) => {
        const { item, newIndex, oldIndex, from } = evt;
        
        // REVERSIÓN DE DOM OBLIGATORIA: Devolvemos el nodo a donde React lo espera.
        // Esto evita el error "NotFoundError: Failed to execute 'removeChild' on 'Node'"
        if (from && item && oldIndex !== undefined) {
          try {
            if (oldIndex < (newIndex ?? 0)) {
              from.insertBefore(item, from.children[oldIndex] || null);
            } else {
              from.insertBefore(item, from.children[oldIndex + 1] || null);
            }
          } catch (e) {
            // Error silencioso si el DOM ya cambió
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
        } catch (e) {
          // No hacer nada si el nodo ya fue eliminado por React
        }
        sortableRef.current = null;
      }
    };
  }, [onReorder]); 

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
}
