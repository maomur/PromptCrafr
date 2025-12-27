import type { Prompt } from '@/lib/definitions';
import PromptCard from '@/components/prompt-card';
import EmptyState from './empty-state';

export default function PromptList({ prompts }: { prompts: Prompt[] }) {
  if (prompts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
