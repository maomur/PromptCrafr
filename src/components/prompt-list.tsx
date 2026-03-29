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
    const el = listRef.current;
    if (!el) return;

    // Inicializamos SortableJS una sola vez para el contenedor
    // SortableJS es capaz de gestionar hijos dinámicos sin necesidad de re-inicializarse
    const sortable = new Sortable(el, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      forceFallback: true, // Crucial para estabilidad en móviles
      fallbackOnBody: true,
      delay: 150,
      delayOnTouchOnly: true,
      onStart: (evt) => {
        // Capturamos el hermano siguiente original para la reversión exacta
        (evt.item as any)._originalNextSibling = evt.item.nextSibling;
      },
      onEnd: (evt) => {
        const { item, from, oldIndex, newIndex } = evt;
        
        // REVERSIÓN DE DOM OBLIGATORIA: 
        // Devolvemos el nodo a su sitio exacto ANTES de que React vea el cambio de estado.
        // Esto evita el error fatal "Failed to execute 'removeChild' on 'Node'".
        if (from && item) {
          try {
            const nextSibling = (item as any)._originalNextSibling;
            from.insertBefore(item, nextSibling || null);
          } catch (e) {
            // Error silencioso si el nodo ya ha sido manipulado por React
          }
        }

        // Notificamos el cambio de orden solo si las posiciones cambiaron realmente
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
          // Ignorar errores durante el desmontaje seguro
        }
        sortableRef.current = null;
      }
    };
    // No incluimos 'prompts' en las dependencias para evitar ciclos de destrucción/recreación
    // innecesarios que causan bloqueos durante las eliminaciones.
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
