'use client';

import { useEffect, useRef, memo } from 'react';
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

const LinkList = memo(function LinkList({ 
  links, 
  projects,
  onDeleteLink, 
  onEditLink,
  onReorder,
  onMoveToProject
}: LinkListProps) {
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
        originalSiblingRef.current = evt.item.nextSibling;
      },
      onEnd: (evt) => {
        const { oldIndex, newIndex, item, from } = evt;
        
        // REVERSIÓN ATÓMICA PARA REACT
        if (from && item) {
          try {
            if (originalSiblingRef.current) {
              from.insertBefore(item, originalSiblingRef.current);
            } else {
              from.appendChild(item);
            }
          } catch (e) {}
        }

        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
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
});

export default LinkList;
