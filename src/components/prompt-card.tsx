'use client';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Prompt, Project } from '@/lib/definitions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import PromptCardActions from './prompt-card-actions';
import { Badge } from '@/components/ui/badge';
import { Video, Image, FileText, Sparkles, GripVertical, Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useCallback, useMemo } from 'react';

interface PromptCardProps {
  prompt: Prompt;
  projects: Project[];
  onDelete: (id: string) => void;
  onEdit: (prompt: Prompt) => void;
  onMoveToProject: (promptId: string, projectId: string | null) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}

const categoryIcons = {
  Video: <Video className="mr-1.5 h-3.5 w-3.5" />,
  Imagen: <Image className="mr-1.5 h-3.5 w-3.5" />,
  Textos: <FileText className="mr-1.5 h-3.5 w-3.5" />,
  Otros: <Sparkles className="mr-1.5 h-3.5 w-3.5" />,
};

const categoryColors = {
  Video: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  Imagen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  Textos: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Otros: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
}

export default function PromptCard({ 
  prompt, 
  projects,
  onDelete, 
  onEdit, 
  onMoveToProject,
  onMoveUp,
  onMoveDown
}: PromptCardProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const project = useMemo(() => 
    projects.find(p => p.id === prompt.projectId),
    [projects, prompt.projectId]
  );

  const handleCardClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    // Evitar copiar si se hace click en botones o controles
    if (
      target.closest('button') || 
      target.closest('.drag-handle') || 
      target.closest('[role="menuitem"]') ||
      target.closest('[role="menu"]') ||
      target.closest('.no-copy')
    ) {
      return;
    }

    navigator.clipboard.writeText(prompt.content);
    toast({
      title: 'Prompt Copiado',
      description: 'El contenido se ha copiado a tu portapapeles.',
    });
  }, [prompt.content, toast]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('itemId', prompt.id);
    e.dataTransfer.setData('itemType', 'prompt');
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className={cn(
        "group flex h-full cursor-grab active:cursor-grabbing flex-col rounded-xl border-border/20 bg-card text-card-foreground shadow-md transition-all duration-300 hover:shadow-lg relative overflow-hidden select-none touch-pan-y",
        isDragging && "opacity-40 grayscale-[0.5] scale-95"
      )}
    >
      <div 
        className="drag-handle absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-md shadow-sm touch-none z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-move"
        title="Arrastrar para organizar"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <CardHeader className="pt-8 md:pt-6 space-y-3">
        {/* Superior: Etiquetas */}
        <div className="flex flex-wrap items-center gap-2 pr-6">
          {project && (
            <Badge variant="secondary" className="text-[9px] h-4 bg-muted text-muted-foreground font-normal border-none flex items-center gap-1">
              <Folder className="h-2.5 w-2.5" />
              {project.name}
            </Badge>
          )}
          <Badge 
            variant="outline"
            className={cn("flex items-center border-0 text-[10px] px-2 py-0 h-4 font-medium shrink-0", categoryColors[prompt.category])}
          >
            {categoryIcons[prompt.category]}
            {prompt.category}
          </Badge>
        </div>
        
        {/* Cuerpo: Título y Descripción */}
        <div className="space-y-1">
          <CardTitle className="font-bold tracking-tight text-base truncate">
            {prompt.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs leading-relaxed">
            {prompt.description}
          </CardDescription>
        </div>
      </CardHeader>
      
      <div className="flex-grow" /> {/* Espaciador para empujar el footer hacia abajo */}
      
      <CardFooter className="flex items-center justify-between text-[10px] text-muted-foreground pb-4 pt-0">
        <span className="opacity-70">
          {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true, locale: es })}
        </span>
        <div className="no-copy">
          <PromptCardActions 
            prompt={prompt} 
            projects={projects}
            onDelete={onDelete} 
            onEdit={() => onEdit(prompt)}
            onMoveToProject={onMoveToProject}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
        </div>
      </CardFooter>
    </Card>
  );
}