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
  onReorder: (oldIndex: number, newIndex: number) => void;
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
    if (!listRef.current) return;

    const sortable = new Sortable(listRef.current, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      forceFallback: true,
      fallbackOnBody: true,
      onEnd: (evt) => {
        const { item, newIndex, oldIndex, from } = evt;
        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          // Reversión de DOM inmediata
          if (from && item) {
            const children = Array.from(from.children);
            if (oldIndex < newIndex) {
              from.insertBefore(item, children[oldIndex]);
            } else {
              from.insertBefore(item, children[oldIndex].nextSibling || null);
            }
          }
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
          // Silencioso si falla
        }
        sortableRef.current = null;
      }
    };
  }, [onReorder]);

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
