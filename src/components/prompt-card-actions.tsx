'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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

  const handleDeleteConfirm = () => {
    onDelete(prompt.id);
  };

  return (
    <div className="flex items-center gap-0.5">
      {/* Ver/Editar rápido */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
        <Eye className="h-4 w-4" />
        <span className="sr-only">Ver detalles</span>
      </Button>

      {/* Menú de opciones extra (Ideal para móviles) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Más opciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Organizar</DropdownMenuLabel>
          
          {onMoveUp && (
            <DropdownMenuItem onClick={() => onMoveUp(prompt.id)}>
              <ChevronUp className="mr-2 h-4 w-4" />
              Subir posición
            </DropdownMenuItem>
          )}
          
          {onMoveDown && (
            <DropdownMenuItem onClick={() => onMoveDown(prompt.id)}>
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
              <DropdownMenuItem onClick={() => onMoveToProject(prompt.id, null)}>
                Sin Proyecto (General)
              </DropdownMenuItem>
              {projects.length > 0 && <DropdownMenuSeparator />}
              {projects.map((project) => (
                <DropdownMenuItem 
                  key={project.id} 
                  onClick={() => onMoveToProject(prompt.id, project.id)}
                  disabled={prompt.projectId === project.id}
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Opción de eliminar dentro del menú */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-destructive hover:text-destructive-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Prompt
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará el prompt "{prompt.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteConfirm}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
