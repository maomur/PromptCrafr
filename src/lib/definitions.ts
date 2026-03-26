export const promptCategories = ['Video', 'Imagen', 'Textos', 'Otros'] as const;

export type PromptCategory = (typeof promptCategories)[number];

export type Project = {
  id: string;
  name: string;
  createdAt: string;
};

export type Prompt = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: PromptCategory;
  createdAt: string;
  projectId?: string;
};
