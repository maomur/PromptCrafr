import { z } from 'zod';
import { NO_SELECTION, promptCategories } from '@/lib/definitions';

/** Los <Select> nunca guardan "", así que usan el centinela `none`. */
const selectValue = z.string().min(1);

export const promptFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título es obligatorio.')
    .max(120, 'Como máximo 120 caracteres.'),
  description: z
    .string()
    .trim()
    .min(1, 'La descripción es obligatoria.')
    .max(280, 'Como máximo 280 caracteres.'),
  content: z.string().trim().min(1, 'El contenido es obligatorio.'),
  category: selectValue,
  /** Ubicación codificada: `none`, `project:<id>` o `folder:<id>`. */
  location: selectValue,
});

export type PromptFormValues = z.infer<typeof promptFormSchema>;

/**
 * Completa el esquema de una URL escrita a medias.
 *
 * Nadie teclea "https://" al pegar una dirección de memoria, y rechazar
 * "ejemplo.com" por eso sería gratuito.
 */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(normalizeUrl(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const linkFormSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'La URL es obligatoria.')
    .refine(isValidUrl, 'Introduce una dirección web válida (por ejemplo, ejemplo.com/pagina).'),
  title: z.string().trim().max(120, 'Como máximo 120 caracteres.'),
  description: z.string().trim().max(280, 'Como máximo 280 caracteres.'),
  category: selectValue,
  /** Ubicación codificada: `none`, `project:<id>` o `folder:<id>`. */
  location: selectValue,
});

export type LinkFormValues = z.infer<typeof linkFormSchema>;

/** Traduce el centinela de los <Select> al `null` que se guarda en Firestore. */
export function fromSelect(value: string): string | null {
  return value === NO_SELECTION ? null : value;
}

/** Traduce lo guardado en Firestore al valor que espera un <Select>. */
export function toSelect(value: string | null | undefined): string {
  return value ?? NO_SELECTION;
}

/** Valida que una categoría persistida siga siendo una de las conocidas. */
export function toCategory(value: string | null) {
  return promptCategories.includes(value as (typeof promptCategories)[number])
    ? (value as (typeof promptCategories)[number])
    : null;
}

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
