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

  // Mantenemos el callback actualizado sin recrear el effect
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
        (evt.item as any)._originalNextSibling = evt.item.nextSibling;
      },
      onEnd: (evt) => {
        const { item, from, oldIndex, newIndex } = evt;
        
        if (from && item) {
          try {
            const nextSibling = (item as any)._originalNextSibling;
            from.insertBefore(item, nextSibling || null);
          } catch (e) {
            // Reversión silenciosa
          }
        }

        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
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
          if (el && document.contains(el)) {
            sortableRef.current.destroy();
          }
        } catch (e) {
          // ignore
        }
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
