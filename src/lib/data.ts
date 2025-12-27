import type { Prompt } from './definitions';
import { randomUUID } from 'crypto';

// NOTE: This is a simple in-memory "database".
// It will be reset every time the server restarts.
// In a real-world application, you would use a proper database
// like PostgreSQL, MongoDB, or Firebase Firestore.
let prompts: Prompt[] = [
  {
    id: '1',
    title: 'Morning Journal Prompt',
    description: 'A prompt to start the day with reflection.',
    content: 'What are you most grateful for today, and what is one thing you want to accomplish?',
    createdAt: new Date('2023-10-26T10:00:00Z'),
  },
  {
    id: '2',
    title: 'Creative Writing Idea',
    description: 'A starter for a short story.',
    content: 'Write a story about a librarian who discovers a book that writes itself.',
    createdAt: new Date('2023-10-27T11:30:00Z'),
  },
  {
    id: '3',
    title: 'Code Generation for a Button',
    description: 'A prompt for an AI to generate a React button component.',
    content: 'Create a reusable React button component with primary and secondary variants using Tailwind CSS.',
    createdAt: new Date('2023-10-28T14:00:00Z'),
  },
];

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
    prompts[index] = { ...prompts[index], ...data };
    return prompts[index];
  }
  return undefined;
}

export async function deletePrompt(id: string): Promise<void> {
  await wait(500);
  prompts = prompts.filter((p) => p.id !== id);
}
