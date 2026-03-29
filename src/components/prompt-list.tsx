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
  onReorder: (draggedId: string, targetId: string) => void;
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
    // Si no hay prompts o no hay referencia al DOM, nos aseguramos de limpiar
    if (!listRef.current || prompts.length === 0) {
      if (sortableRef.current) {
        sortableRef.current.destroy();
        sortableRef.current = null;
      }
      return;
    }

    // Inicializamos SortableJS con emulación de software (Force Fallback)
    // Este método es el más robusto para evitar conflictos con el scroll en móviles
    sortableRef.current = new Sortable(listRef.current, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      group: {
        name: 'shared-items',
        pull: true,
        put: true
      },
      dataIdAttr: 'data-id',
      // CRITICAL: Force Fallback garantiza que no dependamos de la API nativa fallida de móviles
      forceFallback: true,
      fallbackClass: 'sortable-fallback',
      fallbackOnBody: true,
      // Delay de 150ms para permitir scroll normal antes de arrastrar
      delay: 150,
      delayOnTouchOnly: true,
      onEnd: (evt) => {
        const { item, to, newIndex, oldIndex } = evt;
        const draggedId = item.getAttribute('data-id');
        
        // Solo reordenar si el elemento se soltó en la misma lista
        if (to === listRef.current && oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          const targetItem = listRef.current.children[newIndex] as HTMLElement;
          const targetId = targetItem?.getAttribute('data-id');
          if (draggedId && targetId) {
            onReorder(draggedId, targetId);
          }
        }
      },
    });

    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
        sortableRef.current = null;
      }
    };
  }, [prompts.length, onReorder, onMoveToProject]); // Escuchamos cambios en la longitud

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div 
      ref={listRef} 
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {prompts.map((prompt) => (
        <div key={prompt.id} data-id={prompt.id} data-type="prompt" className="h-full">
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
