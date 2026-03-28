import type { Prompt, Project } from '@/lib/definitions';
import PromptCard from '@/components/prompt-card';
import EmptyState from './empty-state';

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
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, prompt.id)}
          className="h-full"
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
