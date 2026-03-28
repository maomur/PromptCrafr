'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Link, Project } from '@/lib/definitions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, ExternalLink, Trash2, GripVertical, Eye, MoreVertical, FolderInput } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LinkCardProps {
  link: Link;
  projects: Project[];
  onDelete: (id: string) => void;
  onEdit: (link: Link) => void;
  onMoveToProject: (linkId: string, projectId: string | null) => void;
}

export default function LinkCard({ link, projects, onDelete, onEdit, onMoveToProject }: LinkCardProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('itemId', link.id);
    e.dataTransfer.setData('itemType', 'link');
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleCardClick = (event: React.MouseEvent) => {
    // Evitar copiar si se hace clic en un botón o en el control de arrastre
    if ((event.target as HTMLElement).closest('button') || (event.target as HTMLElement).closest('.drag-handle')) {
      return;
    }

    navigator.clipboard.writeText(link.url);
    toast({
      title: 'Enlace Copiado',
      description: 'La URL se ha copiado a tu portapapeles.',
    });
  };

  return (
    <Card 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className={cn(
        "group flex flex-col h-full cursor-grab active:cursor-grabbing rounded-xl border-border/20 bg-card shadow-md transition-all duration-300 hover:shadow-lg relative overflow-hidden select-none touch-pan-y",
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
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <LinkIcon className="h-4 w-4 text-orange-600" />
            </div>
            {link.category && (
              <Badge variant="secondary" className="text-[10px] py-0 h-4 font-medium bg-orange-50 text-orange-700 border-orange-100">
                {link.category}
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-sm font-semibold truncate pr-2 mt-1">
          {link.title || 'Enlace guardado'}
        </CardTitle>
        {link.description && (
          <CardDescription className="text-xs line-clamp-2 mt-1">
            {link.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow pt-0">
        <div className="bg-muted/30 p-2 rounded-md border border-border/40 overflow-hidden">
          <p className="text-xs font-mono text-muted-foreground truncate flex items-center gap-1.5">
            <span className="shrink-0 opacity-50 italic">URL:</span>
            {link.url}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between text-[10px] text-muted-foreground pt-0">
        <span className="opacity-70">
          {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true, locale: es })}
        </span>
        <div className="flex items-center gap-0.5">
          {/* Abrir Link */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            asChild
          >
            <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Abrir enlace</span>
            </a>
          </Button>

          {/* Ver/Editar (Igual que en Prompts) */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(link);
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Editar enlace</span>
          </Button>

          {/* Opciones (Igual que en Prompts) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Más opciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Organizar</DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInput className="mr-2 h-4 w-4" />
                  Mover a Proyecto
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => onMoveToProject(link.id, null)}>
                    Sin Proyecto
                  </DropdownMenuItem>
                  {projects.length > 0 && <DropdownMenuSeparator />}
                  {projects.map((project) => (
                    <DropdownMenuItem 
                      key={project.id} 
                      onSelect={() => onMoveToProject(link.id, project.id)}
                      disabled={link.projectId === project.id}
                    >
                      {project.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onSelect={() => onDelete(link.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Enlace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}
