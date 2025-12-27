export const promptCategories = ['Video', 'Imagen', 'Textos', 'Otros'] as const;

export type PromptCategory = (typeof promptCategories)[number];

export type Prompt = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: PromptCategory;
  createdAt: Date;
};
