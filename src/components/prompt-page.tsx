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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useLocalStorage from '@/hooks/use-local-storage';

export default function PromptPage() {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>('prompts', []);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [filter, setFilter] = useState<PromptCategory | 'Todos'>('Todos');

  const handleDeletePrompt = (id: string) => {
    setPrompts((currentPrompts) => currentPrompts.filter((p) => p.id !== id));
  };

  const handleSave = (promptData: Omit<Prompt, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      // Edit mode
      setPrompts(prompts.map(p => p.id === id ? { ...p, ...promptData } : p));
    } else {
      // Create mode
      const newPrompt: Prompt = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        ...promptData,
      };
      setPrompts([newPrompt, ...prompts]);
    }
    // Sort after modification
    setPrompts(currentPrompts => [...currentPrompts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const closeAllDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedPrompt(null);
  };

  const handleEditClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditDialogOpen(true);
  };

  const sortedPrompts = [...prompts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredPrompts =
    filter === 'Todos'
      ? sortedPrompts
      : sortedPrompts.filter((p) => p.category === filter);

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
                Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Crear un Nuevo Prompt</DialogTitle>
              </DialogHeader>
              <PromptForm onSave={handleSave} onClose={closeAllDialogs} />
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
          className="sm:max-w-[625px] shadow-3xl"
        >
          <DialogHeader>
            <DialogTitle>Editar Prompt</DialogTitle>
          </DialogHeader>
          {selectedPrompt && (
            <PromptForm
              prompt={selectedPrompt}
              onSave={handleSave}
              onClose={closeAllDialogs}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
