'use client';

import { useState } from 'react';
import type { Prompt } from '@/lib/definitions';
import Header from '@/components/header';
import PromptList from '@/components/prompt-list';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import PromptForm from '@/components/prompt-form';

export default function PromptPage({ initialPrompts }: { initialPrompts: Prompt[] }) {
  const [open, setOpen] = useState(false);

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
            <PromptForm onSave={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </Header>
      <PromptList prompts={initialPrompts} />
    </div>
  );
}
