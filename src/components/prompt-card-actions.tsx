
'use client';

import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Trash2, 
  MoreVertical, 
  FolderInput, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';
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
import type { Prompt, Project } from '@/lib/definitions';

interface PromptCardActionsProps {
  prompt: Prompt;
  projects: Project[];
  onDelete: (id: string) => void;
  onEdit: () => void;
  onMoveToProject: (promptId: string, projectId: string | null) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}

export default function PromptCardActions({ 
  prompt, 
  projects,
  onDelete, 
  onEdit, 
  onMoveToProject,
  onMoveUp,
  onMoveDown
}: PromptCardActionsProps) {
  
  return (
    <div className="flex items-center gap-0.5">
      {/* Ver/Editar rápido */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
        <Eye className="h-4 w-4" />
        <span className="sr-only">Ver detalles</span>
      </Button>

      {/* Menú de opciones extra */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Más opciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56" 
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuLabel>Organizar</DropdownMenuLabel>
          
          {onMoveUp && (
            <DropdownMenuItem onSelect={() => onMoveUp(prompt.id)}>
              <ChevronUp className="mr-2 h-4 w-4" />
              Subir posición
            </DropdownMenuItem>
          )}
          
          {onMoveDown && (
            <DropdownMenuItem onSelect={() => onMoveDown(prompt.id)}>
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
              <DropdownMenuItem onSelect={() => onMoveToProject(prompt.id, null)}>
                Sin Proyecto (General)
              </DropdownMenuItem>
              {projects.length > 0 && <DropdownMenuSeparator />}
              {projects.map((project) => (
                <DropdownMenuItem 
                  key={project.id} 
                  onSelect={() => onMoveToProject(prompt.id, project.id)}
                  disabled={prompt.projectId === project.id}
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            onSelect={() => {
              // Dejamos que el menú se cierre de forma natural antes de disparar la eliminación
              // para evitar que Radix bloquee la interfaz al borrar el elemento del DOM.
              setTimeout(() => onDelete(prompt.id), 10);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Prompt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
