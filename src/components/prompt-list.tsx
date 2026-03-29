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
  
  // Mantenemos el callback en una ref para que SortableJS siempre use la lógica más reciente
  // sin necesidad de reiniciar el efecto de arrastre cuando los datos cambian.
  const onReorderRef = useRef(onReorder);
  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // Inicializamos SortableJS de forma estática. 
    // No dependemos de 'prompts' para evitar destruir/crear la instancia al borrar items.
    const sortable = new Sortable(el, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      forceFallback: true,
      fallbackOnBody: true,
      delay: 150,
      delayOnTouchOnly: true,
      onStart: (evt) => {
        // Guardamos la posición original para la reversión atómica
        (evt.item as any)._originalNextSibling = evt.item.nextSibling;
      },
      onEnd: (evt) => {
        const { item, from, oldIndex, newIndex } = evt;
        
        // REVERSIÓN ATÓMICA: Devolvemos el nodo a su sitio ANTES de que React se de cuenta.
        // Esto es lo que previene el error 'removeChild' y la congelación de la app.
        if (from && item) {
          try {
            const nextSibling = (item as any)._originalNextSibling;
            from.insertBefore(item, nextSibling || null);
          } catch (e) {
            // Reversión silenciosa si el nodo ya no es hijo (e.g. durante un borrado rápido)
          }
        }

        // Ejecutamos la lógica de negocio después de restaurar el DOM físico
        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          setTimeout(() => {
            onReorderRef.current(oldIndex, newIndex);
          }, 0);
        }
      },
    });

    sortableRef.current = sortable;

    return () => {
      // Limpieza defensiva: solo intentamos destruir si el elemento sigue en el documento
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
    // El array de dependencias vacío es CLAVE: el sistema de arrastre es independiente de los datos
    // y React gestionará las actualizaciones de la lista de forma natural.
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