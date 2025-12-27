'use server';

import { createPrompt, deletePrompt, updatePrompt } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const promptSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
  content: z.string().min(1, { message: 'Content is required.' }),
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
      message: 'Failed to create prompt.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await createPrompt(validatedFields.data);
    revalidatePath('/');
    return { message: 'Prompt created successfully.' };
  } catch (e) {
    return { message: 'Database Error: Failed to create prompt.' };
  }
}

export async function updatePromptAction(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = promptSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'Failed to update prompt.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await updatePrompt(id, validatedFields.data);
    revalidatePath('/');
    return { message: 'Prompt updated successfully.' };
  } catch (e) {
    return { message: 'Database Error: Failed to update prompt.' };
  }
}

export async function deletePromptAction(id: string) {
  try {
    await deletePrompt(id);
    revalidatePath('/');
  } catch (e) {
    // In a real app, you'd handle this more gracefully
    console.error('Database Error: Failed to delete prompt.');
  }
}
