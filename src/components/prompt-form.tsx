'use client';

import { useState } from 'react';
import { type Prompt, promptCategories, type PromptCategory, type Project } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SubmitButton from './submit-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PromptFormProps {
  prompt?: Prompt;
  projects?: Project[];
  onSave: (promptData: {
    title: string;
    description: string;
    content: string;
    category: PromptCategory;
    projectId: string | null;
  }, id?: string) => void;
  onClose: () => void;
}

export default function PromptForm({ prompt, projects = [], onSave, onClose }: PromptFormProps) {
  const { toast } = useToast();
  const isEditMode = !!prompt;
  const [title, setTitle] = useState(prompt?.title || '');
  const [description, setDescription] = useState(prompt?.description || '');
  const [category, setCategory] = useState<PromptCategory | ''>(prompt?.category || '');
  const [projectId, setProjectId] = useState<string>(prompt?.projectId || 'none');
  const [content, setContent] = useState(prompt?.content || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title) newErrors.title = 'El título es obligatorio.';
    if (!description) newErrors.description = 'La descripción es obligatoria.';
    if (!category) newErrors.category = 'Por favor, selecciona una categoría válida.';
    if (!content) newErrors.content = 'El contenido es obligatorio.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({ 
        title, 
        description, 
        content, 
        category: category as PromptCategory,
        projectId: projectId === 'none' ? null : projectId
      }, prompt?.id);
      
      toast({
        variant: 'default',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        title: 'Éxito',
        description: `Prompt ${isEditMode ? 'actualizado' : 'creado'} con éxito.`,
      });
      onClose();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, completa todos los campos obligatorios.',
      });
    }
  };


  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor='title'>Título</Label>
            <Input id='title' name="title" placeholder="p. ej., Idea para escritura creativa" value={title} onChange={e => setTitle(e.target.value)} />
            {errors.title && <p className="text-sm font-medium text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label>Proyecto (Carpeta)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin proyecto (General)</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
            <Label htmlFor='description'>Descripción</Label>
            <Input id='description' name="description" placeholder="Una descripción corta y clara del prompt." value={description} onChange={e => setDescription(e.target.value)} />
            {errors.description && <p className="text-sm font-medium text-destructive">{errors.description}</p>}
        </div>
        
        <div className="space-y-2">
            <Label>Categoría</Label>
            <Select name="category" value={category} onValueChange={(value: PromptCategory) => setCategory(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {promptCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm font-medium text-destructive">{errors.category}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor='content'>Contenido del Prompt</Label>
          <Textarea
            id='content'
            name="content"
            placeholder="El contenido completo del prompt..."
            className="min-h-[150px] resize-y"
            value={content} 
            onChange={e => setContent(e.target.value)}
          />
          {errors.content && <p className="text-sm font-medium text-destructive">{errors.content}</p>}
        </div>
        <div className="flex justify-end pt-2">
          <SubmitButton isEditMode={isEditMode} isPending={false} />
        </div>
      </form>
  );
}
