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
    if (!listRef.current) {
      if (sortableRef.current) {
        try {
          sortableRef.current.destroy();
        } catch (e) {}
        sortableRef.current = null;
      }
      return;
    }

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
      forceFallback: true,
      fallbackClass: 'sortable-fallback',
      fallbackOnBody: true,
      delay: 150,
      delayOnTouchOnly: true,
      onEnd: (evt) => {
        const { item, to, newIndex, oldIndex, from } = evt;
        const draggedId = item.getAttribute('data-id');
        
        if (to === from && oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          const targetItem = to.children[newIndex] as HTMLElement;
          const targetId = targetItem?.getAttribute('data-id');
          if (draggedId && targetId) {
            onReorder(draggedId, targetId);
          }
        }
      },
    });

    return () => {
      if (sortableRef.current) {
        try {
          sortableRef.current.destroy();
        } catch (e) {}
        sortableRef.current = null;
      }
    };
  }, [links.length, onReorder, onMoveToProject]);

  return (
    <div 
      ref={listRef}
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {links.map((link) => (
        <div key={link.id} data-id={link.id} data-type="link" className="h-full">
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
