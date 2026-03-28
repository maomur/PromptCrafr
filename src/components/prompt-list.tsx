'use client';

import type { Prompt, Project } from '@/lib/definitions';
import PromptCard from '@/components/prompt-card';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  if (prompts.length === 0) {
    return null;
  }

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
    
    if (itemType === 'prompt' && draggedId && draggedId !== targetId) {
      onReorder(draggedId, targetId);
    }
  };

  const moveUp = (id: string) => {
    const index = prompts.findIndex(p => p.id === id);
    if (index > 0) {
      onReorder(id, prompts[index - 1].id);
    }
  };

  const moveDown = (id: string) => {
    const index = prompts.findIndex(p => p.id === id);
    if (index < prompts.length - 1) {
      onReorder(id, prompts[index + 1].id);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {prompts.map((prompt) => (
        <div 
          key={prompt.id} 
          onDragOver={(e) => handleDragOver(e, prompt.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, prompt.id)}
          className={cn(
            "h-full transition-all duration-200",
            dragOverId === prompt.id && "scale-[1.02] ring-2 ring-primary ring-offset-2 rounded-xl"
          )}
        >
          <PromptCard 
            prompt={prompt} 
            projects={projects}
            onDelete={onDeletePrompt} 
            onEdit={onEditPrompt}
            onMoveToProject={onMoveToProject}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
          />
        </div>
      ))}
    </div>
  );
}
