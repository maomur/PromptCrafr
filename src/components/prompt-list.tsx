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
  const onReorderRef = useRef(onReorder);
  const originalSiblingRef = useRef<Node | null>(null);

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const sortable = new Sortable(el, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      forceFallback: true,
      onStart: (evt) => {
        // Guardamos la posición original exacta del elemento
        originalSiblingRef.current = evt.item.nextSibling;
      },
      onEnd: (evt) => {
        const { oldIndex, newIndex, item, from } = evt;
        
        // REVERSIÓN ATÓMICA: Devolvemos el nodo a su sitio original inmediatamente.
        // Esto es VITAL para que React no pierda el rastro del DOM y lance el error NotFoundError.
        if (from && item) {
          try {
            if (originalSiblingRef.current) {
              from.insertBefore(item, originalSiblingRef.current);
            } else {
              from.appendChild(item);
            }
          } catch (e) {
            // Error silencioso si el DOM ya cambió
          }
        }
        
        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          // Disparamos el callback de reordenamiento después de estabilizar el DOM
          onReorderRef.current(oldIndex, newIndex);
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
  }, []);

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
