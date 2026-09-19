'use client';

import { useForm } from 'react-hook-form';
import { useSingleSubmit } from '@/hooks/use-single-submit';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LocationSelect from '@/features/folders/components/location-select';
import { decodeLocation, type TreeNode } from '@/features/folders/services/tree';
import { encodeLocation } from '@/features/folders/types';
import { type Prompt, type PromptInput, promptCategories } from '@/features/library/types';
import { NO_SELECTION } from '@/lib/constants';
import { type PromptFormValues, promptFormSchema, toCategory } from '@/features/library/schemas';
import { fromSelect, toSelect } from '@/lib/forms';

interface PromptFormProps {
  prompt?: Prompt;
  tree: TreeNode[];
  onSave: (input: PromptInput, id?: string) => void;
  onClose: () => void;
}

export default function PromptForm({ prompt, tree, onSave, onClose }: PromptFormProps) {
  const isEditMode = !!prompt;

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      title: prompt?.title ?? '',
      description: prompt?.description ?? '',
      content: prompt?.content ?? '',
      category: toSelect(prompt?.category),
      location: encodeLocation({
        projectId: prompt?.projectId ?? null,
        folderId: prompt?.folderId ?? null,
      }),
    },
  });

  const guardar = (values: PromptFormValues) => {
    onSave(
      {
        title: values.title,
        description: values.description,
        content: values.content,
        category: toCategory(fromSelect(values.category)),
        ...decodeLocation(values.location, tree),
      },
      prompt?.id
    );
    onClose();
  };

  const { submit, isSubmitting } = useSingleSubmit(guardar);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Asistente de Código" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
                <FormControl>
                  <LocationSelect
                    tree={tree}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Breve resumen de para qué sirve..." {...field} />
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
              <FormLabel>Categoría (opcional)</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value={NO_SELECTION}>Sin categoría</SelectItem>
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

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido del prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Escribe el prompt completo aquí..."
                  className="min-h-[150px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Guardar cambios' : 'Crear prompt'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
