'use client';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Link, Project } from '@/lib/definitions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, ExternalLink, Trash2, GripVertical, Eye, MoreVertical, FolderInput, ChevronUp, ChevronDown, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCallback, useMemo, useRef } from 'react';
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
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}

export default function LinkCard({ link, projects, onDelete, onEdit, onMoveToProject, onMoveUp, onMoveDown }: LinkCardProps) {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const project = useMemo(() => 
    projects.find(p => p.id === link.projectId),
    [projects, link.projectId]
  );

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('itemId', link.id);
    e.dataTransfer.setData('itemType', 'link');
    e.dataTransfer.effectAllowed = 'move';
    
    if (cardRef.current) {
      cardRef.current.classList.add('opacity-40');
    }
  };

  const handleDragEnd = () => {
    if (cardRef.current) {
      cardRef.current.classList.remove('opacity-40');
    }
  };

  const handleCardClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('.drag-handle') || 
      target.closest('[role="menuitem"]') ||
      target.closest('[role="menu"]')
    ) {
      return;
    }

    navigator.clipboard.writeText(link.url);
    toast({
      title: 'Enlace Copiado',
      description: 'La URL se ha copiado a tu portapapeles.',
    });
  }, [link.url, toast]);

  return (
    <Card 
      ref={cardRef}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className="group flex flex-col h-full rounded-xl border-border/20 bg-card shadow-md transition-all duration-300 hover:shadow-lg relative overflow-hidden"
    >
      {/* MANEJO DE ARRASTRE - El bloqueo de scroll se gestiona en MobileDndPolyfill */}
      <div className="drag-handle absolute top-0 right-0">
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
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-orange-100 rounded-md">
              <LinkIcon className="h-4 w-4 text-orange-600" />
            </div>
            {link.category && (
              <Badge variant="secondary" className="text-[11px] py-0 h-6 px-2.5 font-medium bg-orange-50 text-orange-700 border-orange-100">
                {link.category}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <CardTitle className="text-base font-bold truncate">
            {link.title || 'Enlace sin título'}
          </CardTitle>
          {link.description && (
            <CardDescription className="text-[11px] line-clamp-2 leading-relaxed">
              {link.description}
            </CardDescription>
          )}
          <p className="text-[10px] font-mono text-muted-foreground truncate opacity-60 pt-1">
            {link.url}
          </p>
        </div>
      </CardHeader>
      
      <div className="flex-grow" />
      
      <CardFooter className="flex items-center justify-between text-[10px] text-muted-foreground pb-4 pt-0">
        <span className="opacity-70">
          {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true, locale: es })}
        </span>
        <div className="flex items-center gap-0.5 no-copy">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            asChild
          >
            <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Abrir</span>
            </a>
          </Button>

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
            <span className="sr-only">Ver detalles</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Opciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Organizar</DropdownMenuLabel>
              
              {onMoveUp && (
                <DropdownMenuItem onSelect={() => onMoveUp(link.id)}>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Subir posición
                </DropdownMenuItem>
              )}
              
              {onMoveDown && (
                <DropdownMenuItem onSelect={() => onMoveDown(link.id)}>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Bajar posición
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              
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
                  {projects.map((p) => (
                    <DropdownMenuItem 
                      key={p.id} 
                      onSelect={() => onMoveToProject(link.id, p.id)}
                      disabled={link.projectId === p.id}
                    >
                      {p.name}
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
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}
