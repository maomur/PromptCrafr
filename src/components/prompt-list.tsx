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

    const sortable = new Sortable(listRef.current, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      forceFallback: true,
      fallbackOnBody: true,
      delay: 150,
      delayOnTouchOnly: true,
      onEnd: (evt) => {
        const { item, oldIndex, newIndex, from } = evt;
        
        // REVERSIÓN DE DOM OBLIGATORIA: Devolvemos el nodo a su sitio original antes de que React lo vea.
        // Esto es CRÍTICO para evitar el error "removeChild" al borrar elementos.
        if (from && item && oldIndex !== undefined) {
          try {
            const referenceNode = from.children[oldIndex];
            if (referenceNode !== item) {
              from.insertBefore(item, referenceNode);
            }
          } catch (e) {
            // Silencioso
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
          // Silencioso
        }
        sortableRef.current = null;
      }
    };
  }, [onReorder]); // Mantenemos dependencias mínimas para evitar re-inicializaciones costosas

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
