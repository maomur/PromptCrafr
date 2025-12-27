'use server';

import { createPrompt, deletePrompt, updatePrompt } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Prompt } from '@/lib/definitions';
import { promptCategories } from '@/lib/definitions';

const promptSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: 'El título es obligatorio.' }),
  description: z.string().min(1, { message: 'La descripción es obligatoria.' }),
  content: z.string().min(1, { message: 'El contenido es obligatorio.' }),
  category: z.enum(promptCategories, {
    errorMap: () => ({ message: 'Por favor, selecciona una categoría válida.' }),
  }),
});

export type FormState = {
  message: string;
  errors?: {
    id?: string[];
    title?: string[];
    description?: string[];
    content?: string[];
    category?: string[];
  };
  prompt?: Prompt;
};

export async function createPromptAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = promptSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'No se pudo crear el prompt.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { id, ...dataToCreate } = validatedFields.data;
    const newPrompt = await createPrompt(dataToCreate);
    revalidatePath('/');
    return { message: 'Prompt creado con éxito.', prompt: newPrompt };
  } catch (e) {
    return { message: 'Error de base de datos: No se pudo crear el prompt.' };
  }
}

export async function updatePromptAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = promptSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'No se pudo actualizar el prompt.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { id, ...dataToUpdate } = validatedFields.data;

  if (!id) {
    return { message: 'Error: ID de prompt no encontrado.' };
  }

  try {
    const updatedPrompt = await updatePrompt(id, dataToUpdate);
    revalidatePath('/');
    if (!updatedPrompt) {
      return { message: 'Error de base de datos: No se pudo encontrar el prompt para actualizar.' };
    }
    return { message: 'Prompt actualizado con éxito.', prompt: updatedPrompt };
  } catch (e) {
    return { message: 'Error de base de datos: No se pudo actualizar el prompt.' };
  }
}

export async function deletePromptAction(id: string) {
  try {
    await deletePrompt(id);
    revalidatePath('/');
  } catch (e) {
    console.error('Error de base de datos: No se pudo eliminar el prompt.');
    return { error: 'Error de base de datos: No se pudo eliminar el prompt.' };
  }
}
