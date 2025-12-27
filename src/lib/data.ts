import type { Prompt, PromptCategory } from './definitions';
import { randomUUID } from 'crypto';
import { promptCategories } from './definitions';

// NOTE: This is a simple in-memory "database".
// It will be reset every time the server restarts.
// In a real-world application, you would use a proper database
// like PostgreSQL, MongoDB, or Firebase Firestore.
let prompts: Prompt[] = [];

// Simulate network latency
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPrompts(): Promise<Prompt[]> {
  await wait(500);
  return prompts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPromptById(id: string): Promise<Prompt | undefined> {
  await wait(300);
  return prompts.find((p) => p.id === id);
}

export async function createPrompt(data: Omit<Prompt, 'id' | 'createdAt'>): Promise<Prompt> {
  await wait(500);
  const newPrompt: Prompt = {
    id: randomUUID(),
    ...data,
    createdAt: new Date(),
  };
  prompts.unshift(newPrompt);
  return newPrompt;
}

export async function updatePrompt(id: string, data: Partial<Omit<Prompt, 'id' | 'createdAt'>>): Promise<Prompt | undefined> {
  await wait(500);
  const index = prompts.findIndex((p) => p.id === id);
  if (index !== -1) {
    prompts[index] = { ...prompts[index], ...data } as Prompt;
    return prompts[index];
  }
  return undefined;
}

export async function deletePrompt(id: string): Promise<void> {
  await wait(500);
  prompts = prompts.filter((p) => p.id !== id);
}
