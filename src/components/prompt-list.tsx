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

    // Inicialización estable de SortableJS
    const sortable = new Sortable(listRef.current, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      forceFallback: true, // Crítico para estabilidad en móviles
      fallbackOnBody: true,
      onEnd: (evt) => {
        const { item, newIndex, oldIndex, from } = evt;
        
        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          // REVERSIÓN DE DOM: Devolvemos el elemento a su sitio para que React no se rompa
          if (from && item) {
            const children = Array.from(from.children);
            if (oldIndex < newIndex) {
              from.insertBefore(item, children[oldIndex]);
            } else {
              from.insertBefore(item, children[oldIndex].nextSibling || null);
            }
          }
          // Notificamos al padre para que actualice el estado/Firebase
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
          // Ignorar errores si el nodo ya fue eliminado por React
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
