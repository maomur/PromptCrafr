'use client';

import { useEffect, useRef } from 'react';
import type { Link, Project } from '@/lib/definitions';
import LinkCard from '@/components/link-card';
import Sortable from 'sortablejs';

interface LinkListProps {
  links: Link[];
  projects: Project[];
  onDeleteLink: (id: string) => void;
  onEditLink: (link: Link) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onMoveToProject: (linkId: string, projectId: string | null) => void;
}

export default function LinkList({ 
  links, 
  projects,
  onDeleteLink, 
  onEditLink,
  onReorder,
  onMoveToProject
}: LinkListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);

  useEffect(() => {
    if (listRef.current && links.length > 0) {
      sortableRef.current = new Sortable(listRef.current, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        group: 'shared-items',
        dataIdAttr: 'data-id',
        forceFallback: true, // Crucial for mobile support
        fallbackClass: 'sortable-fallback',
        fallbackOnBody: true,
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
  }, [links, onReorder, onMoveToProject]);

  return (
    <div 
      ref={listRef}
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {links.map((link) => (
        <div key={link.id} data-id={link.id} className="h-full">
          <LinkCard 
            link={link} 
            projects={projects}
            onDelete={onDeleteLink}
            onEdit={onEditLink}
            onMoveToProject={onMoveToProject}
          />
        </div>
      ))}
    </div>
  );
}