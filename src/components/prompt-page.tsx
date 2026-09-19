'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { FolderTree, Link as LinkIcon, Loader2, LogOut, Plus, Sparkles } from 'lucide-react';

import Header from '@/components/header';
import EmptyState from '@/components/empty-state';
import LinkCard from '@/components/link-card';
import LinkForm from '@/components/link-form';
import PromptCard from '@/components/prompt-card';
import PromptForm from '@/components/prompt-form';
import FolderCard from '@/components/folder-card';
import LibraryToolbar from '@/components/library-toolbar';
import NameDialog, { type NameDialogRequest } from '@/components/name-dialog';
import ProjectSidebar from '@/components/project-sidebar';
import SortableGrid from '@/components/sortable-grid';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLibrary, type ItemKind } from '@/hooks/use-library';
import { useToast } from '@/hooks/use-toast';
import { logOut, useAuth } from '@/firebase';
import {
  decodeLocation,
  matchesFilter,
  type Folder,
  type LibraryFilter,
  type Link,
  type Location,
  type Project,
  type Prompt,
  type PromptCategory,
} from '@/lib/definitions';
import { matchesQuery, parseQuery } from '@/lib/search';

const ALL_CATEGORIES = 'Todos';
type CategoryFilter = PromptCategory | typeof ALL_CATEGORIES;

/** Ubicación de un recurso, tolerando documentos antiguos sin `folderId`. */
function locationOf(item: { projectId: string | null; folderId?: string | null }): Location {
  return { projectId: item.projectId ?? null, folderId: item.folderId ?? null };
}

function matchesCategory(
  item: { category?: PromptCategory | null },
  category: CategoryFilter
): boolean {
  return category === ALL_CATEGORIES || item.category === category;
}

/** Campos de un prompt sobre los que busca el usuario. */
function promptHaystack(prompt: Prompt) {
  return [prompt.title, prompt.description, prompt.content];
}

/** Campos de un enlace sobre los que busca el usuario. */
function linkHaystack(link: Link) {
  return [link.title, link.description, link.url];
}

/** Lo que se está a punto de borrar, a la espera de confirmación. */
type PendingDeletion =
  | { kind: 'prompt'; item: Prompt }
  | { kind: 'link'; item: Link }
  | { kind: 'project'; item: Project }
  | { kind: 'folder'; item: Folder };

export default function PromptPage({ user }: { user: User }) {
  const auth = useAuth();
  const { toast } = useToast();
  const library = useLibrary(user);
  const { projects, folders, prompts, links } = library;

  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [isCreatingPrompt, setCreatingPrompt] = useState(false);
  const [isCreatingLink, setCreatingLink] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>({ type: 'all' });
  const [nameRequest, setNameRequest] = useState<NameDialogRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // El campo de texto responde al instante y el filtrado de la lista puede ir
  // un fotograma por detrás si la biblioteca es grande.
  const deferredQuery = useDeferredValue(searchQuery);
  const searchTerms = useMemo(() => parseQuery(deferredQuery), [deferredQuery]);

  const visiblePrompts = useMemo(
    () =>
      prompts.filter(
        (prompt) =>
          matchesFilter(locationOf(prompt), activeFilter) &&
          matchesCategory(prompt, categoryFilter) &&
          matchesQuery(promptHaystack(prompt), searchTerms)
      ),
    [prompts, activeFilter, categoryFilter, searchTerms]
  );
  const visibleLinks = useMemo(
    () =>
      links.filter(
        (link) =>
          matchesFilter(locationOf(link), activeFilter) &&
          matchesCategory(link, categoryFilter) &&
          matchesQuery(linkHaystack(link), searchTerms)
      ),
    [links, activeFilter, categoryFilter, searchTerms]
  );

  // Los contadores de la barra lateral cuentan prompts y enlaces juntos, y no
  // tienen en cuenta el filtro de categoría: describen el proyecto, no la vista.
  const counts = useMemo(() => {
    const result: Record<string, number> = {
      all: prompts.length + links.length,
      unassigned: 0,
    };
    for (const project of projects) result[`project:${project.id}`] = 0;
    for (const folder of folders) result[`folder:${folder.id}`] = 0;

    for (const item of [...prompts, ...links]) {
      const { projectId, folderId } = locationOf(item);
      if (!projectId || projectId === 'none') {
        result.unassigned += 1;
        continue;
      }
      // El contador del proyecto incluye lo que hay en sus carpetas.
      const projectKey = `project:${projectId}`;
      if (projectKey in result) result[projectKey] += 1;

      const folderKey = `folder:${folderId}`;
      if (folderId && folderKey in result) result[folderKey] += 1;
    }
    return result;
  }, [projects, folders, prompts, links]);

  const confirmDeletion = useCallback(() => {
    if (!pendingDeletion) return;

    if (pendingDeletion.kind === 'project') {
      library.deleteProject(pendingDeletion.item.id);
      // Si estábamos mirando dentro de lo que acaba de desaparecer, volvemos
      // a la vista general en lugar de quedarnos en un filtro fantasma.
      if (
        (activeFilter.type === 'project' || activeFilter.type === 'folder') &&
        activeFilter.projectId === pendingDeletion.item.id
      ) {
        setActiveFilter({ type: 'all' });
      }
      toast({ title: 'Proyecto eliminado' });
    } else if (pendingDeletion.kind === 'folder') {
      library.deleteFolder(pendingDeletion.item.id);
      if (activeFilter.type === 'folder' && activeFilter.folderId === pendingDeletion.item.id) {
        setActiveFilter({ type: 'project', projectId: pendingDeletion.item.projectId });
      }
      toast({ title: 'Carpeta eliminada' });
    } else {
      library.deleteItem(pendingDeletion.kind, pendingDeletion.item.id);
      toast({
        title: pendingDeletion.kind === 'prompt' ? 'Prompt eliminado' : 'Enlace eliminado',
      });
    }

    setPendingDeletion(null);
  }, [pendingDeletion, library, activeFilter, toast]);

  const moveTo = useCallback(
    (kind: ItemKind, itemId: string, location: Location) => {
      library.moveTo(kind, itemId, location);
      toast({ title: 'Recurso organizado' });
    },
    [library, toast]
  );

  // Las cuatro acciones de nombrar comparten un único diálogo.
  const askForName = useCallback((request: NameDialogRequest) => setNameRequest(request), []);

  /** Mueve un elemento una posición arriba o abajo dentro de la lista visible. */
  const step = useCallback(
    (kind: ItemKind, list: { id: string; order: number }[], index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return undefined;
      return () => library.reorder(kind, list, index, target);
    },
    [library]
  );

  const deletionCopy = useMemo(() => {
    if (!pendingDeletion) return null;
    if (pendingDeletion.kind === 'prompt') {
      return {
        title: '¿Eliminar prompt?',
        body: `Se eliminará definitivamente «${pendingDeletion.item.title}». Esta acción no se puede deshacer.`,
        action: 'Eliminar',
      };
    }
    if (pendingDeletion.kind === 'link') {
      return {
        title: '¿Eliminar enlace?',
        body: `Se eliminará definitivamente «${pendingDeletion.item.title || pendingDeletion.item.url}». Esta acción no se puede deshacer.`,
        action: 'Eliminar',
      };
    }
    if (pendingDeletion.kind === 'folder') {
      return {
        title: '¿Eliminar carpeta?',
        body: `Se eliminará la carpeta «${pendingDeletion.item.name}». Lo que contiene no se borra: quedará suelto dentro del proyecto.`,
        action: 'Eliminar carpeta',
      };
    }
    return {
      title: '¿Eliminar proyecto?',
      body: `Se eliminará el proyecto «${pendingDeletion.item.name}», junto con sus carpetas. Los prompts y enlaces que contiene no se borran: pasarán a «Sin proyecto».`,
      action: 'Eliminar proyecto',
    };
  }, [pendingDeletion]);

  /**
   * Carpetas que se muestran como tarjetas.
   *
   * Sólo al mirar un proyecto entero: dentro de una carpeta ya no hay nada
   * más abajo que enseñar, y en «Todos» serían ruido.
   */
  const visibleFolders = useMemo(
    () =>
      activeFilter.type === 'project'
        ? folders.filter((folder) => folder.projectId === activeFilter.projectId)
        : [],
    [folders, activeFilter]
  );

  /** Mueve un recurso a la ubicación sobre la que se ha soltado. */
  const handleDropOnTarget = useCallback(
    (kind: ItemKind, itemId: string, encodedLocation: string) => {
      const source = kind === 'prompt' ? prompts : links;
      const item = source.find((candidate) => candidate.id === itemId);
      if (!item) return;

      const destination = decodeLocation(encodedLocation, folders);
      const current = locationOf(item);

      // Soltar algo donde ya estaba no merece ni una escritura ni un aviso.
      if (
        current.projectId === destination.projectId &&
        current.folderId === destination.folderId
      ) {
        return;
      }

      library.moveTo(kind, itemId, destination);
      toast({ title: 'Recurso movido' });
    },
    [prompts, links, folders, library, toast]
  );

  const isEmpty =
    visiblePrompts.length === 0 && visibleLinks.length === 0 && visibleFolders.length === 0;

  return (
    <div className="relative min-h-[80vh]">
      <Header>
        <Button variant="ghost" size="icon" onClick={() => logOut(auth)}>
          <LogOut className="h-5 w-5 text-muted-foreground transition-colors hover:text-destructive" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </Header>

      <div className="flex flex-col gap-8 md:flex-row">
        <ProjectSidebar
          projects={projects}
          folders={folders}
          counts={counts}
          activeFilter={activeFilter}
          onSelect={setActiveFilter}
          onCreateProject={() =>
            askForName({
              title: 'Nuevo proyecto',
              description: 'Agrupa prompts y enlaces relacionados bajo un mismo nombre.',
              confirmLabel: 'Crear',
              onConfirm: (name) => {
                library.createProject(name);
                toast({ title: 'Proyecto creado' });
              },
            })
          }
          onRenameProject={(project) =>
            askForName({
              title: 'Renombrar proyecto',
              description: `Elige un nombre nuevo para «${project.name}».`,
              initialValue: project.name,
              confirmLabel: 'Guardar',
              onConfirm: (name) => {
                library.renameProject(project.id, name);
                toast({ title: 'Proyecto renombrado' });
              },
            })
          }
          onDeleteProject={(project) => setPendingDeletion({ kind: 'project', item: project })}
          onCreateFolder={(project) =>
            askForName({
              title: 'Nueva carpeta',
              description: `Se creará dentro del proyecto «${project.name}».`,
              confirmLabel: 'Crear',
              onConfirm: (name) => {
                library.createFolder(project.id, name);
                toast({ title: 'Carpeta creada' });
              },
            })
          }
          onRenameFolder={(folder) =>
            askForName({
              title: 'Renombrar carpeta',
              description: `Elige un nombre nuevo para «${folder.name}».`,
              initialValue: folder.name,
              confirmLabel: 'Guardar',
              onConfirm: (name) => {
                library.renameFolder(folder.id, name);
                toast({ title: 'Carpeta renombrada' });
              },
            })
          }
          onDeleteFolder={(folder) => setPendingDeletion({ kind: 'folder', item: folder })}
        />

        <main className="flex-1 pb-24">
          {!library.isLoading && (
            <LibraryToolbar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              category={categoryFilter}
              onCategoryChange={(value) => setCategoryFilter(value as CategoryFilter)}
              allCategoriesLabel={ALL_CATEGORIES}
              resultCount={visiblePrompts.length + visibleLinks.length}
            />
          )}

          {library.isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 pt-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cargando biblioteca...</p>
            </div>
          ) : isEmpty ? (
            <EmptyState
              isFiltered={prompts.length + links.length > 0}
              searchQuery={searchQuery}
              onCreatePrompt={() => setCreatingPrompt(true)}
              onClearFilters={() => {
                setActiveFilter({ type: 'all' });
                setCategoryFilter(ALL_CATEGORIES);
                setSearchQuery('');
              }}
            />
          ) : (
            <div className="space-y-8">
              {visibleFolders.length > 0 && (
                <section className="space-y-4">
                  <h2 className="flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    <FolderTree className="h-4 w-4" /> Carpetas ({visibleFolders.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        count={counts[`folder:${folder.id}`] ?? 0}
                        onOpen={() =>
                          setActiveFilter({
                            type: 'folder',
                            projectId: folder.projectId,
                            folderId: folder.id,
                          })
                        }
                        onRename={() =>
                          askForName({
                            title: 'Renombrar carpeta',
                            description: `Elige un nombre nuevo para «${folder.name}».`,
                            initialValue: folder.name,
                            confirmLabel: 'Guardar',
                            onConfirm: (name) => {
                              library.renameFolder(folder.id, name);
                              toast({ title: 'Carpeta renombrada' });
                            },
                          })
                        }
                        onDelete={() => setPendingDeletion({ kind: 'folder', item: folder })}
                      />
                    ))}
                  </div>
                </section>
              )}

              {visibleLinks.length > 0 && (
                <section className="space-y-4">
                  <h2 className="flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                    <LinkIcon className="h-4 w-4" /> Enlaces ({visibleLinks.length})
                  </h2>
                  <SortableGrid
                    items={visibleLinks}
                    group="links"
                    onReorder={(from, to) => library.reorder('link', visibleLinks, from, to)}
                    onDropOnTarget={(id, location) => handleDropOnTarget('link', id, location)}
                    renderItem={(link) => {
                      const index = visibleLinks.indexOf(link);
                      return (
                        <LinkCard
                          link={link}
                          projects={projects}
                          onEdit={setEditingLink}
                          onDelete={(item) => setPendingDeletion({ kind: 'link', item })}
                          folders={folders}
                          onMoveTo={(location) => moveTo('link', link.id, location)}
                          onMoveUp={step('link', visibleLinks, index, -1)}
                          onMoveDown={step('link', visibleLinks, index, 1)}
                        />
                      );
                    }}
                  />
                </section>
              )}

              {visiblePrompts.length > 0 && (
                <section className="space-y-4">
                  <h2 className="flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-widest text-primary">
                    <Sparkles className="h-4 w-4" /> Prompts ({visiblePrompts.length})
                  </h2>
                  <SortableGrid
                    items={visiblePrompts}
                    group="prompts"
                    onReorder={(from, to) => library.reorder('prompt', visiblePrompts, from, to)}
                    onDropOnTarget={(id, location) => handleDropOnTarget('prompt', id, location)}
                    renderItem={(prompt) => {
                      const index = visiblePrompts.indexOf(prompt);
                      return (
                        <PromptCard
                          prompt={prompt}
                          projects={projects}
                          onEdit={setEditingPrompt}
                          onDelete={(item) => setPendingDeletion({ kind: 'prompt', item })}
                          folders={folders}
                          onMoveTo={(location) => moveTo('prompt', prompt.id, location)}
                          onMoveUp={step('prompt', visiblePrompts, index, -1)}
                          onMoveDown={step('prompt', visiblePrompts, index, 1)}
                        />
                      );
                    }}
                  />
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Botones flotantes de creación */}
      <div className="fixed bottom-8 right-8 z-40 flex items-center gap-3">
        <Dialog open={isCreatingLink} onOpenChange={setCreatingLink}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-orange-500 shadow-2xl hover:bg-orange-600"
            >
              <LinkIcon className="h-8 w-8 text-white" />
              <span className="sr-only">Guardar un enlace</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Nuevo enlace</DialogTitle>
              <DialogDescription>Guarda una dirección web en tu biblioteca.</DialogDescription>
            </DialogHeader>
            <LinkForm
              projects={projects}
              folders={folders}
              onSave={(input) => {
                library.saveLink(input);
                toast({ title: 'Enlace guardado' });
              }}
              onClose={() => setCreatingLink(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isCreatingPrompt} onOpenChange={setCreatingPrompt}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-16 w-16 rounded-full shadow-2xl">
              <Plus className="h-8 w-8" />
              <span className="sr-only">Crear un prompt</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Nuevo prompt</DialogTitle>
              <DialogDescription>Añade un prompt reutilizable a tu biblioteca.</DialogDescription>
            </DialogHeader>
            <PromptForm
              projects={projects}
              folders={folders}
              onSave={(input) => {
                library.savePrompt(input);
                toast({ title: 'Prompt creado' });
              }}
              onClose={() => setCreatingPrompt(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edición. El contenido se desmonta al cerrar, así que el formulario
          siempre arranca con los datos del recurso seleccionado. */}
      <Dialog open={!!editingPrompt} onOpenChange={(open) => !open && setEditingPrompt(null)}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Editar prompt</DialogTitle>
            <DialogDescription>Modifica los datos y guarda los cambios.</DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <PromptForm
              prompt={editingPrompt}
              projects={projects}
              folders={folders}
              onSave={(input, id) => {
                library.savePrompt(input, id);
                toast({ title: 'Prompt actualizado' });
              }}
              onClose={() => setEditingPrompt(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Editar enlace</DialogTitle>
            <DialogDescription>Modifica los datos y guarda los cambios.</DialogDescription>
          </DialogHeader>
          {editingLink && (
            <LinkForm
              link={editingLink}
              projects={projects}
              folders={folders}
              onSave={(input, id) => {
                library.saveLink(input, id);
                toast({ title: 'Enlace actualizado' });
              }}
              onClose={() => setEditingLink(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <NameDialog request={nameRequest} onClose={() => setNameRequest(null)} />

      {/* Una sola confirmación para todos los tipos de borrado. */}
      <AlertDialog
        open={!!pendingDeletion}
        onOpenChange={(open) => !open && setPendingDeletion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deletionCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{deletionCopy?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeletion}
            >
              {deletionCopy?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
