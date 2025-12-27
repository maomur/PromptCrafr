'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createPromptAction, updatePromptAction, type FormState } from '@/app/actions';
import type { Prompt } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useActionState } from 'react';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SubmitButton from './submit-button';

const promptSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
  content: z.string().min(20, { message: 'El contenido debe tener al menos 20 caracteres.' }),
});

type PromptFormValues = z.infer<typeof promptSchema>;

interface PromptFormProps {
  prompt?: Prompt;
  onDataChanged: (prompt: Prompt) => void;
}

export default function PromptForm({ prompt, onDataChanged }: PromptFormProps) {
  const { toast } = useToast();
  const isEditMode = !!prompt;
  const initialState: FormState = { message: '' };

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: prompt?.title || '',
      description: prompt?.description || '',
      content: prompt?.content || '',
    },
  });

  const action = isEditMode ? updatePromptAction.bind(null, prompt.id) : createPromptAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.errors) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      } else {
        toast({
          variant: 'default',
          className: 'bg-accent text-accent-foreground',
          title: 'Éxito',
          description: state.message,
        });

        if (onDataChanged && state.prompt) {
          onDataChanged(state.prompt);
        }
      }
    }
  }, [state, onDataChanged, toast]);


  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="p. ej., Idea para escritura creativa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Una descripción corta y clara del prompt." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido del Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="El contenido completo del prompt..."
                  className="min-h-[150px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <SubmitButton isEditMode={isEditMode} isPending={isPending} />
        </div>
      </form>
    </Form>
  );
}
