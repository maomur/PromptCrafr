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
import { type FolderInput, MAX_DEPTH } from '@/features/folders/types';
import { NO_SELECTION } from '@/lib/constants';
import { parentOptions, type TreeNode } from '@/features/folders/services/tree';
import { type FolderFormValues, folderFormSchema } from '@/features/folders/schemas';

interface FolderFormProps {
  tree: TreeNode[];
  /** Nodo que se está editando; sirve para no dejar moverlo dentro de sí mismo. */
  moving?: TreeNode;
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
  tree,
  moving,
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
      parent: initial?.parent ?? NO_SELECTION,
    },
  });

  const options = parentOptions(tree, moving);

  const handleSubmit = (values: FolderFormValues) => {
    onSave({
      name: values.name,
      description: values.description || null,
      parent: lockParent ? (initial?.parent ?? NO_SELECTION) : values.parent,
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
            name="parent"
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
                    <SelectItem value={NO_SELECTION} disabled={!!moving}>
                      <span className="flex items-center gap-2">
                        <Folders className="h-4 w-4" />
                        Carpeta principal
                      </span>
                    </SelectItem>
                    {options.length > 0 && <SelectSeparator />}

                    {/* El sangrado reproduce el árbol; las opciones que
                        romperían el límite de niveles salen desactivadas. */}
                    {options.map((option) => (
                      <SelectItem
                        key={option.key}
                        value={option.key}
                        disabled={option.disabled}
                        style={{ paddingLeft: `${(option.depth - 1) * 16 + 32}px` }}
                      >
                        <span className="flex items-center gap-2">
                          <FolderIcon className="h-4 w-4 shrink-0 opacity-70" />
                          <span className="truncate">{option.name}</span>
                          {option.reason && (
                            <span className="text-[10px] opacity-60">({option.reason})</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  {moving
                    ? 'Al cambiarla de sitio se muda con todo lo que contiene.'
                    : `Una carpeta principal es un proyecto. La jerarquía admite hasta ${MAX_DEPTH} niveles.`}
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
