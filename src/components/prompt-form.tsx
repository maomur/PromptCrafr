'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import { createPromptAction, updatePromptAction, type FormState } from '@/app/actions';
import { type Prompt, promptCategories } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SubmitButton from './submit-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PromptFormProps {
  prompt?: Prompt;
  onDataChanged: (prompt: Prompt) => void;
  onClose: () => void;
}

export default function PromptForm({ prompt, onDataChanged, onClose }: PromptFormProps) {
  const { toast } = useToast();
  const isEditMode = !!prompt;
  const initialState: FormState = { message: '' };
  
  const action = isEditMode ? updatePromptAction : createPromptAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.errors || state.message.startsWith('Error:')) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      } else {
        toast({
          variant: 'default',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
          title: 'Éxito',
          description: state.message,
        });

        if (state.prompt) {
          onDataChanged(state.prompt);
          onClose();
        }
      }
    }
  }, [state.message, state.errors, state.prompt, onDataChanged, toast, onClose]);


  return (
      <form action={formAction} className="space-y-6">
        {isEditMode && <input type="hidden" name="id" value={prompt.id} />}
        <div className="space-y-2">
          <Label htmlFor='title'>Título</Label>
          <Input id='title' name="title" placeholder="p. ej., Idea para escritura creativa" defaultValue={prompt?.title || ''} />
          {state.errors?.title && <p className={cn("text-sm font-medium text-destructive")}>{state.errors.title[0]}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor='description'>Descripción</Label>
            <Textarea id='description' name="description" placeholder="Una descripción corta y clara del prompt." defaultValue={prompt?.description || ''} className="min-h-[80px] resize-y" />
            {state.errors?.description && <p className={cn("text-sm font-medium text-destructive")}>{state.errors.description[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select name="category" defaultValue={prompt?.category}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {promptCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.errors?.category && <p className={cn("text-sm font-medium text-destructive")}>{state.errors.category[0]}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor='content'>Contenido del Prompt</Label>
          <Textarea
            id='content'
            name="content"
            placeholder="El contenido completo del prompt..."
            className="min-h-[150px] resize-y"
            defaultValue={prompt?.content || ''}
          />
          {state.errors?.content && <p className={cn("text-sm font-medium text-destructive")}>{state.errors.content[0]}</p>}
        </div>
        <div className="flex justify-end">
          <SubmitButton isEditMode={isEditMode} isPending={isPending} />
        </div>
      </form>
  );
}
