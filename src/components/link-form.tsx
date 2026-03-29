'use client';

import { useState } from 'react';
import { promptCategories, type PromptCategory, type Project, type Link } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LinkFormProps {
  link?: Link;
  projects: Project[];
  onSave: (linkData: {
    url: string;
    projectId: string;
    title?: string;
    description?: string;
    category: PromptCategory;
  }, id?: string) => void;
  onClose: () => void;
}

export default function LinkForm({ link, projects, onSave, onClose }: LinkFormProps) {
  const { toast } = useToast();
  const isEditMode = !!link;
  
  const [url, setUrl] = useState(link?.url || '');
  const [projectId, setProjectId] = useState<string>(link?.projectId || projects[0]?.id || 'none');
  const [title, setTitle] = useState(link?.title || '');
  const [description, setDescription] = useState(link?.description || '');
  const [category, setCategory] = useState<PromptCategory>(link?.category || 'Textos');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !projectId || projectId === 'none') {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'La URL y el Proyecto son obligatorios.',
      });
      return;
    }

    setIsSubmitting(true);
    onSave({
      url: url.trim(),
      projectId,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      category: category,
    }, link?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">URL (Obligatorio)</Label>
        <Input 
          id="url" 
          placeholder="https://ejemplo.com" 
          type="url"
          value={url} 
          onChange={e => setUrl(e.target.value)} 
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="link-project-select">Asignar a Proyecto (Obligatorio)</Label>
        <Select value={projectId} onValueChange={setProjectId} modal={false}>
          <SelectTrigger id="link-project-select">
            <SelectValue placeholder="Selecciona un proyecto" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="none">Sin proyecto (General)</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="link-title">Nombre (Opcional)</Label>
          <Input 
            id="link-title" 
            placeholder="Título del enlace" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="link-category-select">Categoría</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as PromptCategory)} modal={false}>
            <SelectTrigger id="link-category-select">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              {promptCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="link-description">Descripción (Opcional)</Label>
        <Textarea 
          id="link-description" 
          placeholder="Breve nota sobre este enlace..." 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white border-none">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Guardar Cambios' : 'Guardar Enlace'}
        </Button>
      </div>
    </form>
  );
}
