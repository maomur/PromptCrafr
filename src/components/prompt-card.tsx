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
import { useState, useCallback, useMemo, useRef } from 'react';

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
  Video: <Video className="mr-1.5 h-4 w-4" />,
  Imagen: <Image className="mr-1.5 h-4 w-4" />,
  Textos: <FileText className="mr-1.5 h-4 w-4" />,
  Otros: <Sparkles className="mr-1.5 h-4 w-4" />,
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
  const isReadyToDrag = useRef(false);

  const project = useMemo(() => 
    projects.find(p => p.id === prompt.projectId),
    [projects, prompt.projectId]
  );

  const handleCardClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
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
    // FILTRADO ESTRICTO: Solo permitimos arrastrar si el contacto empezó en el mango
    if (!isReadyToDrag.current) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('itemId', prompt.id);
    e.dataTransfer.setData('itemType', 'prompt');
    e.dataTransfer.effectAllowed = 'move';
    
    // El feedback visual se retrasa un milisegundo para no interrumpir el inicio del drag
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    isReadyToDrag.current = false;
  };

  return (
    <Card 
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className={cn(
        "group flex h-full flex-col rounded-xl border-border/20 bg-card text-card-foreground shadow-md transition-all duration-300 hover:shadow-lg relative overflow-hidden select-none",
        isDragging && "opacity-40 grayscale-[0.5] scale-95",
      )}
    >
      {/* Mango de arrastre: Zona de control exclusiva para móviles y escritorio */}
      <div 
        className="drag-handle absolute top-0 right-0 bg-background/90 backdrop-blur-sm rounded-bl-xl border-l border-b border-border/40 shadow-sm z-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        onPointerDown={(e) => {
          isReadyToDrag.current = true;
          // Evitamos que el scroll se active en el mango inmediatamente
          if (e.pointerType === 'touch') {
            // El touch-action: none en CSS y el listener global en MobileDndPolyfill hacen el resto
          }
        }}
        onPointerUp={() => {
          // No reseteamos inmediatamente para dar tiempo al evento 'dragstart' a dispararse
          setTimeout(() => {
            if (!isDragging) isReadyToDrag.current = false;
          }, 200);
        }}
        title="Arrastrar para organizar"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <CardHeader className="pt-12 md:pt-10 space-y-4">
        <div className="flex flex-wrap items-center gap-2 pr-10">
          {project && (
            <Badge variant="secondary" className="text-[11px] h-6 bg-muted text-muted-foreground font-normal border-none flex items-center gap-1.5 px-2.5">
              <Folder className="h-4 w-4" />
              {project.name}
            </Badge>
          )}
          <Badge 
            variant="outline"
            className={cn("flex items-center border-0 text-[11px] px-2.5 py-0 h-6 font-medium shrink-0", categoryColors[prompt.category])}
          >
            {categoryIcons[prompt.category]}
            {prompt.category}
          </Badge>
        </div>
        
        <div className="space-y-1.5">
          <CardTitle className="font-bold tracking-tight text-base truncate">
            {prompt.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-[11px] leading-relaxed">
            {prompt.description}
          </CardDescription>
        </div>
      </CardHeader>
      
      <div className="flex-grow" />
      
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