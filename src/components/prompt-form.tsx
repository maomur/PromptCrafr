'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createPromptAction, updatePromptAction, type FormState } from '@/app/actions';
import { type Prompt, promptCategories } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useActionState } from 'react';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

const promptSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
  content: z.string().min(20, { message: 'El contenido debe tener al menos 20 caracteres.' }),
  category: z.enum(promptCategories, {
    errorMap: () => ({ message: 'Por favor, selecciona una categoría.' }),
  }),
});

type PromptFormValues = z.infer<typeof promptSchema>;

interface PromptFormProps {
  prompt?: Prompt;
  onDataChanged: (prompt: Prompt) => void;
  onClose: () => void;
}

export default function PromptForm({ prompt, onDataChanged, onClose }: PromptFormProps) {
  const { toast } = useToast();
  const isEditMode = !!prompt;
  const initialState: FormState = { message: '' };

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: prompt?.title || '',
      description: prompt?.description || '',
      content: prompt?.content || '',
      category: prompt?.category || undefined,
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
          className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
          title: 'Éxito',
          description: state.message,
        });

        if (state.prompt) {
          onDataChanged(state.prompt);
          onClose(); // Cierra el diálogo en caso de éxito
        }
      }
    }
  }, [state, onDataChanged, toast, onClose]);


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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {promptCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
