'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
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
import { decodeLocation, type TreeNode } from '@/features/folders/tree';
import { encodeLocation } from '@/features/folders/types';
import { type Link, type LinkInput, promptCategories } from '@/features/library/types';
import { NO_SELECTION } from '@/lib/constants';
import { type LinkFormValues, linkFormSchema, normalizeUrl, toCategory } from '@/features/library/schemas';
import { fromSelect, toSelect } from '@/lib/forms';

interface LinkFormProps {
  link?: Link;
  tree: TreeNode[];
  onSave: (input: LinkInput, id?: string) => void;
  onClose: () => void;
}

export default function LinkForm({ link, tree, onSave, onClose }: LinkFormProps) {
  const isEditMode = !!link;

  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      url: link?.url ?? '',
      title: link?.title ?? '',
      description: link?.description ?? '',
      category: toSelect(link?.category),
      location: encodeLocation({
        projectId: link?.projectId ?? null,
        folderId: link?.folderId ?? null,
      }),
    },
  });

  const handleSubmit = (values: LinkFormValues) => {
    onSave(
      {
        url: normalizeUrl(values.url),
        // Guardamos null en lugar de "" para que las tarjetas puedan distinguir
        // "sin título" de un título vacío.
        title: values.title || null,
        description: values.description || null,
        category: toCategory(fromSelect(values.category)),
        ...decodeLocation(values.location, tree),
      },
      link?.id
    );
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="ejemplo.com/pagina"
                  inputMode="url"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Si omites «https://» lo añadimos por ti.
              </FormDescription>
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Título del enlace" {...field} />
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Breve nota sobre este enlace..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="border-none bg-orange-500 text-white hover:bg-orange-600"
          >
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Guardar cambios' : 'Guardar enlace'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
