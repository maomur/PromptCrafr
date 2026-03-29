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
  
  // Usamos una ref para el callback para mantener el useEffect estable
  const onReorderRef = useRef(onReorder);
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
      fallbackOnBody: true,
      delay: 150,
      delayOnTouchOnly: true,
      onStart: (evt) => {
        // Almacenamos la posición original exacta para la reversión
        (evt.item as any)._originalNextSibling = evt.item.nextSibling;
      },
      onEnd: (evt) => {
        const { item, from, oldIndex, newIndex } = evt;
        
        // REVERSIÓN ATÓMICA: Devolvemos el nodo a su sitio ANTES de cualquier cambio de estado
        if (from && item) {
          try {
            const nextSibling = (item as any)._originalNextSibling;
            from.insertBefore(item, nextSibling || null);
          } catch (e) {
            // Ignorar errores de manipulación de DOM si el nodo ya no existe
          }
        }

        // Ejecutamos la lógica de negocio después de restaurar el DOM
        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          // Usamos setTimeout para asegurar que React procese el cambio en un nuevo ciclo
          setTimeout(() => {
            onReorderRef.current(oldIndex, newIndex);
          }, 0);
        }
      },
    });

    sortableRef.current = sortable;

    return () => {
      if (sortableRef.current) {
        try {
          // Limpieza segura: solo si el elemento sigue en el DOM
          if (el && document.contains(el)) {
            sortableRef.current.destroy();
          }
        } catch (e) {
          // ignore
        }
        sortableRef.current = null;
      }
    };
    // Dependencias mínimas para evitar reinicializaciones costosas
  }, []);

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
