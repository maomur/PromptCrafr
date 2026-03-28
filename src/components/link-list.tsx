'use client';

import type { Link } from '@/lib/definitions';
import LinkCard from '@/components/link-card';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface LinkListProps {
  links: Link[];
  onDeleteLink: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
}

export default function LinkList({ 
  links, 
  onDeleteLink, 
  onReorder,
}: LinkListProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) setDragOverId(id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const draggedId = e.dataTransfer.getData('itemId');
    const itemType = e.dataTransfer.getData('itemType');
    
    if (itemType === 'link' && draggedId && draggedId !== targetId) {
      onReorder(draggedId, targetId);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {links.map((link) => (
        <div 
          key={link.id} 
          onDragOver={(e) => handleDragOver(e, link.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, link.id)}
          className={cn(
            "h-full transition-all duration-200",
            dragOverId === link.id && "scale-[1.02] ring-2 ring-orange-400 ring-offset-2 rounded-xl"
          )}
        >
          <LinkCard 
            link={link} 
            onDelete={onDeleteLink}
          />
        </div>
      ))}
    </div>
  );
}