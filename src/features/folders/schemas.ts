import { z } from 'zod';
import { selectValue } from '@/lib/forms';

export const folderFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(60, 'Como máximo 60 caracteres.'),
  description: z.string().trim().max(200, 'Como máximo 200 caracteres.'),
  /** Ubicación codificada: `none`, `project:<id>` o `folder:<id>`. */
  parent: selectValue,
});

export type FolderFormValues = z.infer<typeof folderFormSchema>;
