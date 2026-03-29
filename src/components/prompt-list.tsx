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
    if (listRef.current && prompts.length > 0) {
      sortableRef.current = new Sortable(listRef.current, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        group: 'shared-items',
        dataIdAttr: 'data-id',
        delay: 150, // Mobile support: hold to drag
        delayOnTouchOnly: true,
        onEnd: (evt) => {
          const { item, to, newIndex, oldIndex } = evt;
          const draggedId = item.getAttribute('data-id');
          
          if (to === listRef.current && oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
            const targetItem = listRef.current.children[newIndex] as HTMLElement;
            const targetId = targetItem?.getAttribute('data-id');
            if (draggedId && targetId) {
              onReorder(draggedId, targetId);
            }
          }
          
          if (to.classList.contains('project-drop-target')) {
            const projectId = to.getAttribute('data-project-id');
            if (draggedId) {
              onMoveToProject(draggedId, projectId === 'all' || projectId === 'none' ? null : projectId);
              if (item.parentNode === to) {
                to.removeChild(item);
              }
            }
          }
        },
      });
    }

    return () => {
      sortableRef.current?.destroy();
    };
  }, [prompts, onReorder, onMoveToProject]);

  if (prompts.length === 0) {
    return null;
  }

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
