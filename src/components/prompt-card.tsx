
'use client';

import {
  Card,
  CardContent,
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
import { Video, Image, FileText, Sparkles, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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

  const handleCardClick = (event: React.MouseEvent) => {
    // No copiar si se hace clic en botones de acción o el drag handle
    if ((event.target as HTMLElement).closest('button') || (event.target as HTMLElement).closest('.drag-handle')) {
      return;
    }

    navigator.clipboard.writeText(prompt.content);
    toast({
      title: 'Prompt Copiado',
      description: 'El contenido se ha copiado a tu portapapeles.',
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', prompt.id);
    e.dataTransfer.effectAllowed = 'move';
    // Pequeño retardo para asegurar que la imagen fantasma se cree antes de cambiar la opacidad
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
        title="Arrastrar para reordenar o mover a proyecto"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <CardHeader className="pt-8 md:pt-6">
        <div className="flex justify-between items-start pr-6">
          <CardTitle className="font-semibold tracking-tight text-base truncate pr-2">{prompt.title}</CardTitle>
          <Badge 
            variant="outline"
            className={cn("flex items-center border-0 text-[10px] px-2 py-0 h-5 font-medium shrink-0", categoryColors[prompt.category])}
          >
            {categoryIcons[prompt.category]}
            {prompt.category}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 text-sm pt-1">{prompt.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="font-mono text-sm text-muted-foreground line-clamp-3 bg-muted/30 p-2 rounded-md">
          {prompt.content}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-[10px] text-muted-foreground pt-0">
        <span className="opacity-70">
          {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true, locale: es })}
        </span>
        <PromptCardActions 
          prompt={prompt} 
          projects={projects}
          onDelete={onDelete} 
          onEdit={() => onEdit(prompt)}
          onMoveToProject={onMoveToProject}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </CardFooter>
    </Card>
  );
}
