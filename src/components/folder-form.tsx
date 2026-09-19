'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Folder as FolderIcon, Folders } from 'lucide-react';
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NO_SELECTION, type FolderInput, type Project } from '@/lib/definitions';
import { folderFormSchema, fromSelect, toSelect, type FolderFormValues } from '@/lib/schemas';

interface FolderFormProps {
  projects: Project[];
  /** Valores de partida. Vacío al crear. */
  initial?: Partial<FolderInput>;
  /**
   * Oculta el selector de ubicación.
   *
   * Se usa al editar un proyecto: convertirlo en subcarpeta rompería el límite
   * de dos niveles, porque sus propias carpetas quedarían a un tercer nivel.
   */
  lockParent?: boolean;
  submitLabel: string;
  onSave: (input: FolderInput) => void;
  onClose: () => void;
}

/**
 * Formulario compartido por los dos niveles de la jerarquía.
 *
 * Un proyecto es, sencillamente, una carpeta sin padre. Tratarlos con el mismo
 * formulario evita mantener dos diálogos que piden casi lo mismo.
 */
export default function FolderForm({
  projects,
  initial,
  lockParent = false,
  submitLabel,
  onSave,
  onClose,
}: FolderFormProps) {
  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      parentId: toSelect(initial?.parentId ?? null),
    },
  });

  const handleSubmit = (values: FolderFormValues) => {
    onSave({
      name: values.name,
      description: values.description || null,
      parentId: lockParent ? (initial?.parentId ?? null) : fromSelect(values.parentId),
    });
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Nómina" autoComplete="off" autoFocus {...field} />
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
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Para qué sirve esta carpeta..."
                  className="min-h-[70px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!lockParent && (
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" sideOffset={4} className="max-h-72">
                    <SelectItem value={NO_SELECTION}>
                      <span className="flex items-center gap-2">
                        <Folders className="h-4 w-4" />
                        Carpeta principal
                      </span>
                    </SelectItem>
                    {projects.length > 0 && <SelectSeparator />}
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="flex items-center gap-2">
                          <FolderIcon className="h-4 w-4" />
                          Dentro de {project.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Una carpeta principal es un proyecto. Dentro de ella puedes crear subcarpetas,
                  pero no subcarpetas de subcarpetas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-violet-600 text-white hover:bg-violet-700">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
