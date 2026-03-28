'use client';

import { useState, useEffect } from 'react';
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
  
  // Estados con valores iniciales limpios
  const [title, setTitle] = useState(prompt?.title || '');
  const [description, setDescription] = useState(prompt?.description || '');
  const [category, setCategory] = useState<PromptCategory>(prompt?.category || 'Textos');
  const [projectId, setProjectId] = useState<string>(prompt?.projectId || 'none');
  const [content, setContent] = useState(prompt?.content || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'El título es obligatorio.';
    if (!description.trim()) newErrors.description = 'La descripción es obligatoria.';
    if (!category) newErrors.category = 'Por favor, selecciona una categoría.';
    if (!content.trim()) newErrors.content = 'El contenido es obligatorio.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (validate()) {
      setIsSubmitting(true);
      try {
        onSave({ 
          title: title.trim(), 
          description: description.trim(), 
          content: content.trim(), 
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
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al guardar',
          description: 'Hubo un problema técnico al procesar tu solicitud.',
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Formulario incompleto',
        description: 'Por favor, revisa los campos marcados en rojo.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor='title'>Título</Label>
          <Input 
            id='title' 
            name="title" 
            placeholder="Nombre del prompt..." 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
          {errors.title && <p className="text-xs font-medium text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label>Proyecto (Opcional)</Label>
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
          <Label htmlFor='description'>Descripción Corta</Label>
          <Input 
            id='description' 
            name="description" 
            placeholder="¿Para qué sirve este prompt?" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
          {errors.description && <p className="text-xs font-medium text-destructive">{errors.description}</p>}
      </div>
      
      <div className="space-y-2">
          <Label>Categoría</Label>
          <Select value={category} onValueChange={(value: PromptCategory) => setCategory(value)}>
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
          {errors.category && <p className="text-xs font-medium text-destructive">{errors.category}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor='content'>Contenido del Prompt</Label>
        <Textarea
          id='content'
          name="content"
          placeholder="Escribe aquí el contenido completo..."
          className="min-h-[150px] font-mono text-sm resize-y"
          value={content} 
          onChange={e => setContent(e.target.value)}
        />
        {errors.content && <p className="text-xs font-medium text-destructive">{errors.content}</p>}
      </div>

      <div className="flex justify-end pt-2">
        <SubmitButton isEditMode={isEditMode} isPending={isSubmitting} />
      </div>
    </form>
  );
}
