export const promptCategories = ['Video', 'Imagen', 'Textos', 'Otros'] as const;

export type PromptCategory = (typeof promptCategories)[number];

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
};

export type Prompt = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: PromptCategory | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  projectId: string | null;
  order: number;
};

export type Link = {
  id: string;
  url: string;
  projectId: string | null;
  title?: string;
  description?: string;
  category?: PromptCategory | null;
  createdAt: string;
  ownerId: string;
  order: number;
};