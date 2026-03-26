import type { Prompt } from '@/lib/definitions';
import PromptCard from '@/components/prompt-card';
import EmptyState from './empty-state';

interface PromptListProps {
  prompts: Prompt[];
  onDeletePrompt: (id: string) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onReorder: (draggedId: string, targetId: string) => void;
}

export default function PromptList({ prompts, onDeletePrompt, onEditPrompt, onReorder }: PromptListProps) {
  if (prompts.length === 0) {
    return <EmptyState />;
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    const draggedId = e.dataTransfer.getData('promptId');
    if (draggedId && draggedId !== targetId) {
      onReorder(draggedId, targetId);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {prompts.map((prompt) => (
        <div 
          key={prompt.id} 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, prompt.id)}
        >
          <PromptCard 
            prompt={prompt} 
            onDelete={onDeletePrompt} 
            onEdit={onEditPrompt}
          />
        </div>
      ))}
    </div>
  );
}
