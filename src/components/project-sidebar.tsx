'use client';

import { useState } from 'react';
import {
  ChevronRight,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  Folders,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { filterKey, type Folder, type LibraryFilter, type Project } from '@/lib/definitions';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  projects: Project[];
  folders: Folder[];
  /** Número de recursos por filtro, indexado con `filterKey`. */
  counts: Record<string, number>;
  activeFilter: LibraryFilter;
  onSelect: (filter: LibraryFilter) => void;
  onCreateProject: () => void;
  onRenameProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onCreateFolder: (project: Project) => void;
  onRenameFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
}

const rowClass = (isActive: boolean) =>
  cn(
    'flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all',
    isActive ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-accent/50'
  );

/** Contador a la derecha de cada fila. */
function Count({ value }: { value: number }) {
  return <span className="shrink-0 font-mono text-sm font-medium opacity-70">({value})</span>;
}

export default function ProjectSidebar({
  projects,
  folders,
  counts,
  activeFilter,
  onSelect,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: ProjectSidebarProps) {
  // Un proyecto se despliega al pulsar su flecha, y también solo si el filtro
  // activo apunta a una de sus carpetas.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const activeKey = filterKey(activeFilter);

  const isExpanded = (projectId: string) =>
    expanded[projectId] ??
    (activeFilter.type === 'folder' && activeFilter.projectId === projectId);

  return (
    <aside className="w-full shrink-0 space-y-2 md:w-64">
      <div className="flex items-center justify-between border-b border-border/40 px-2 pb-2">
        <h2 className="flex items-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Folders className="mr-2 h-4 w-4" /> Proyectos
        </h2>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateProject}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Nuevo proyecto</span>
        </Button>
      </div>

      <nav className="space-y-1">
        <button
          type="button"
          onClick={() => onSelect({ type: 'all' })}
          className={rowClass(activeKey === 'all')}
          aria-current={activeKey === 'all' ? 'true' : undefined}
        >
          <span className="flex items-center">
            <Folders className="mr-2 h-4 w-4" />
            Todos
          </span>
          <Count value={counts.all ?? 0} />
        </button>

        <button
          type="button"
          onClick={() => onSelect({ type: 'unassigned' })}
          className={rowClass(activeKey === 'unassigned')}
          aria-current={activeKey === 'unassigned' ? 'true' : undefined}
        >
          <span className="flex items-center">
            <FolderIcon className="mr-2 h-4 w-4" />
            Sin proyecto
          </span>
          <Count value={counts.unassigned ?? 0} />
        </button>

        {projects.map((project) => {
          const projectFolders = folders.filter((folder) => folder.projectId === project.id);
          const projectKey = `project:${project.id}`;
          const open = isExpanded(project.id);

          return (
            <Collapsible
              key={project.id}
              open={open}
              onOpenChange={(value) => setExpanded((prev) => ({ ...prev, [project.id]: value }))}
            >
              {/* Fila del proyecto: desplegar, seleccionar y menú son tres
                  botones hermanos, nunca anidados unos dentro de otros. */}
              <div className="group flex items-center gap-0.5">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-6 shrink-0"
                    disabled={projectFolders.length === 0}
                  >
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform',
                        open && 'rotate-90',
                        projectFolders.length === 0 && 'opacity-0'
                      )}
                    />
                    <span className="sr-only">
                      {open ? 'Contraer' : 'Desplegar'} las carpetas de {project.name}
                    </span>
                  </Button>
                </CollapsibleTrigger>

                <button
                  type="button"
                  onClick={() => onSelect({ type: 'project', projectId: project.id })}
                  className={rowClass(activeKey === projectKey)}
                  aria-current={activeKey === projectKey ? 'true' : undefined}
                >
                  <span className="flex min-w-0 items-center">
                    {open ? (
                      <FolderOpen className="mr-2 h-4 w-4 shrink-0" />
                    ) : (
                      <FolderIcon className="mr-2 h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">{project.name}</span>
                  </span>
                  <Count value={counts[projectKey] ?? 0} />
                </button>

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-7 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Opciones del proyecto {project.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => onRenameProject(project)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Renombrar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onCreateFolder(project)}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Nueva carpeta
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                      onSelect={() => onDeleteProject(project)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar proyecto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CollapsibleContent className="space-y-1 pt-1">
                {projectFolders.map((folder) => {
                  const folderKey = `folder:${folder.id}`;
                  return (
                    <div key={folder.id} className="group/folder flex items-center gap-0.5 pl-6">
                      <button
                        type="button"
                        onClick={() =>
                          onSelect({ type: 'folder', projectId: project.id, folderId: folder.id })
                        }
                        className={cn(rowClass(activeKey === folderKey), 'py-1.5 text-[13px]')}
                        aria-current={activeKey === folderKey ? 'true' : undefined}
                      >
                        <span className="flex min-w-0 items-center">
                          <FolderIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{folder.name}</span>
                        </span>
                        <Count value={counts[folderKey] ?? 0} />
                      </button>

                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/folder:opacity-100 data-[state=open]:opacity-100"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                            <span className="sr-only">Opciones de la carpeta {folder.name}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onSelect={() => onRenameFolder(folder)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Renombrar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onSelect={() => onDeleteFolder(folder)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar carpeta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>
    </aside>
  );
}
