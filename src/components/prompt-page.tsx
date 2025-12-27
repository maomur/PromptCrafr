'use client';

import { useState } from 'react';
import type { Prompt } from '@/lib/definitions';
import Header from '@/components/header';
import PromptList from '@/components/prompt-list';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import PromptForm from '@/components/prompt-form';
import { deletePromptAction } from '@/app/actions';

export default function PromptPage({ initialPrompts }: { initialPrompts: Prompt[] }) {
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);

  const handleDeletePrompt = async (id: string) => {
    // Optimistically update UI
    setPrompts(prompts.filter((p) => p.id !== id));
    // Call server action
    await deletePromptAction(id);
  };

  // This function would be called after a prompt is created or updated
  const handleDataChange = (changedPrompt: Prompt) => {
    const exists = prompts.some(p => p.id === changedPrompt.id);
    if (exists) {
      setPrompts(prompts.map(p => p.id === changedPrompt.id ? changedPrompt : p));
    } else {
      // For new prompts, we need to get the full list again
      // A better approach would be for the action to return the created prompt
      // For now, let's assume we can add it (this might have issues if the server data is different)
      // A proper fix would be to refetch or get the new prompt from the action response.
      // Let's prepend the new prompt optimistically.
       setPrompts(prevPrompts => [changedPrompt, ...prevPrompts]);
    }
  };

  return (
    <div className="space-y-8">
      <Header>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="-ml-1 h-4 w-4" />
              Nuevo Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Crear un Nuevo Prompt</DialogTitle>
            </DialogHeader>
            <PromptForm 
              onSave={() => setOpen(false)}
              onDataChanged={handleDataChange} 
            />
          </DialogContent>
        </Dialog>
      </Header>
      <PromptList 
        prompts={prompts} 
        onDeletePrompt={handleDeletePrompt}
        onDataChanged={handleDataChange}
      />
    </div>
  );
}
