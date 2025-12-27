'use server';

import { createPrompt, deletePrompt, updatePrompt } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const promptSchema = z.object({
  title: z.string().min(1, { message: 'El título es obligatorio.' }),
  description: z.string().min(1, { message: 'La descripción es obligatoria.' }),
  content: z.string().min(1, { message: 'El contenido es obligatorio.' }),
});

export type FormState = {
  message: string;
  errors?: {
    title?: string[];
    description?: string[];
    content?: string[];
  };
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
    await createPrompt(validatedFields.data);
    revalidatePath('/'); // Esto es importante para cuando recargues la página
    return { message: 'Prompt creado con éxito.' };
  } catch (e) {
    return { message: 'Error de base de datos: No se pudo crear el prompt.' };
  }
}

export async function updatePromptAction(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = promptSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'No se pudo actualizar el prompt.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await updatePrompt(id, validatedFields.data);
    revalidatePath('/'); // Esto es importante para cuando recargues la página
    return { message: 'Prompt actualizado con éxito.' };
  } catch (e) {
    return { message: 'Error de base de datos: No se pudo actualizar el prompt.' };
  }
}

export async function deletePromptAction(id: string) {
  try {
    await deletePrompt(id);
    revalidatePath('/');
  } catch (e) {
    // En una aplicación real, manejarías esto con más gracia
    console.error('Error de base de datos: No se pudo eliminar el prompt.');
    // Podrías devolver un error aquí si quisieras manejarlo en el cliente
    return { error: 'Error de base de datos: No se pudo eliminar el prompt.' };
  }
}
