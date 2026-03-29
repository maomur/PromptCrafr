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

    let nextSibling: Node | null = null;

    const sortable = new Sortable(el, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      forceFallback: true,
      onStart: (evt) => {
        // Capturar el hermano siguiente para la reversión atómica perfecta
        nextSibling = evt.item.nextSibling;
      },
      onEnd: (evt) => {
        const { oldIndex, newIndex, item, from } = evt;
        
        /**
         * REVERSIÓN ATÓMICA DE DOM:
         * Devolvemos el nodo a su posición original EXACTA antes de que React actualice.
         * Esto previene que React falle al intentar limpiar nodos "ensuciados" por SortableJS.
         */
        if (from && item) {
          try {
            from.insertBefore(item, nextSibling);
          } catch (e) {
            // Silencioso: el nodo puede haber sido ya gestionado por React
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
  }, []); // Efecto estático para evitar colisiones durante re-renders de Firebase

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
