import type { Prompt } from '@/lib/definitions';
import PromptCard from '@/components/prompt-card';
import EmptyState from './empty-state';

interface PromptListProps {
  prompts: Prompt[];
  onDeletePrompt: (id: string) => void;
  onDataChanged: (prompt: Prompt) => void;
}

export default function PromptList({ prompts, onDeletePrompt, onDataChanged }: PromptListProps) {
  if (prompts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {prompts.map((prompt) => (
        <PromptCard 
          key={prompt.id} 
          prompt={prompt} 
          onDelete={onDeletePrompt} 
          onDataChanged={onDataChanged}
        />
      ))}
    </div>
  );
}
