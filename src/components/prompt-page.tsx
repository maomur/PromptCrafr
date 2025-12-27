'use client';

import { useState } from 'react';
import type { Prompt, PromptCategory } from '@/lib/definitions';
import { promptCategories } from '@/lib/definitions';
import Header from '@/components/header';
import PromptList from '@/components/prompt-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import PromptForm from '@/components/prompt-form';
import { deletePromptAction } from '@/app/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PromptPage({
  initialPrompts,
}: {
  initialPrompts: Prompt[];
}) {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [filter, setFilter] = useState<PromptCategory | 'Todos'>('Todos');

  const handleDeletePrompt = (id: string) => {
    deletePromptAction(id);
    setPrompts((currentPrompts) => currentPrompts.filter((p) => p.id !== id));
  };

  const handleDataChange = (changedPrompt: Prompt) => {
    const exists = prompts.some((p) => p.id === changedPrompt.id);
    if (exists) {
      setPrompts(
        prompts.map((p) => (p.id === changedPrompt.id ? changedPrompt : p))
      );
    } else {
      setPrompts((prevPrompts) => [changedPrompt, ...prevPrompts]);
    }
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedPrompt(null);
  };

  const handleEditClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditDialogOpen(true);
  };

  const filteredPrompts =
    filter === 'Todos'
      ? prompts
      : prompts.filter((p) => p.category === filter);

  return (
    <div className="space-y-8">
      <Header>
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as PromptCategory | 'Todos')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todas las categorías</SelectItem>
              {promptCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
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
              <PromptForm onDataChanged={handleDataChange} />
            </DialogContent>
          </Dialog>
        </div>
      </Header>

      <PromptList
        prompts={filteredPrompts}
        onDeletePrompt={handleDeletePrompt}
        onEditPrompt={handleEditClick}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-[625px]"
        >
          <DialogHeader>
            <DialogTitle>Editar Prompt</DialogTitle>
          </DialogHeader>
          {selectedPrompt && (
            <PromptForm
              prompt={selectedPrompt}
              onDataChanged={handleDataChange}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
