'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  FolderPlus,
  FolderTree,
  Link as LinkIcon,
  Loader2,
  LogOut,
  Plus,
  Sparkles,
} from 'lucide-react';

import Header from '@/components/header';
import EmptyState from '@/components/empty-state';
import LinkCard from '@/components/link-card';
import LinkForm from '@/components/link-form';
import PromptCard from '@/components/prompt-card';
import PromptForm from '@/components/prompt-form';
import BreadcrumbNav from '@/components/breadcrumb-nav';
import FolderCard from '@/components/folder-card';
import FolderForm from '@/components/folder-form';
import LibraryToolbar from '@/components/library-toolbar';
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
  NO_SELECTION,
  filterKey,
  matchesFilter,
  type FolderInput,
  type LibraryFilter,
  type Link,
  type Location,
  type Prompt,
  type PromptCategory,
} from '@/lib/definitions';
import {
  decodeLocation,
  findNode,
  pathTo,
  subtreeFolderIds,
  type TreeNode,
} from '@/lib/tree';
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

/**
 * Qué está pidiendo el diálogo de carpetas.
 *
 * Crear admite una ubicación de partida: el botón flotante la deja libre y el
 * menú de una carpeta la trae ya puesta.
 */
type FolderDialog =
  | { mode: 'create'; parent: string }
  | { mode: 'edit'; node: TreeNode };

/** Lo que se está a punto de borrar, a la espera de confirmación. */
type PendingDeletion =
  | { kind: 'prompt'; item: Prompt }
  | { kind: 'link'; item: Link }
  | { kind: 'node'; item: TreeNode };

export default function PromptPage({ user }: { user: User }) {
  const auth = useAuth();
  const { toast } = useToast();
  const library = useLibrary(user);
  const { tree, counts, prompts, links } = library;

  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [isCreatingPrompt, setCreatingPrompt] = useState(false);
  const [isCreatingLink, setCreatingLink] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>({ type: 'all' });
  const [folderDialog, setFolderDialog] = useState<FolderDialog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // El campo de texto responde al instante y el filtrado de la lista puede ir
  // un fotograma por detrás si la biblioteca es grande.
  const deferredQuery = useDeferredValue(searchQuery);
  const searchTerms = useMemo(() => parseQuery(deferredQuery), [deferredQuery]);

  /** Nodo abierto ahora mismo, si el filtro apunta a uno. */
  const activeNode = useMemo(
    () => (activeFilter.type === 'all' || activeFilter.type === 'unassigned'
      ? undefined
      : findNode(tree, filterKey(activeFilter))),
    [tree, activeFilter]
  );

  /**
   * Carpetas que cuentan para el filtro actual.
   *
   * Entrar en una carpeta muestra también lo que hay en sus subcarpetas, igual
   * que entrar en una principal muestra todo lo suyo.
   */
  const folderScope = useMemo(
    () => (activeNode && activeNode.kind === 'folder' ? subtreeFolderIds(activeNode) : undefined),
    [activeNode]
  );

  const visiblePrompts = useMemo(
    () =>
      prompts.filter(
        (prompt) =>
          matchesFilter(locationOf(prompt), activeFilter, folderScope) &&
          matchesCategory(prompt, categoryFilter) &&
          matchesQuery(promptHaystack(prompt), searchTerms)
      ),
    [prompts, activeFilter, folderScope, categoryFilter, searchTerms]
  );
  const visibleLinks = useMemo(
    () =>
      links.filter(
        (link) =>
          matchesFilter(locationOf(link), activeFilter, folderScope) &&
          matchesCategory(link, categoryFilter) &&
          matchesQuery(linkHaystack(link), searchTerms)
      ),
    [links, activeFilter, folderScope, categoryFilter, searchTerms]
  );


  const confirmDeletion = useCallback(() => {
    if (!pendingDeletion) return;

    if (pendingDeletion.kind === 'node') {
      const node = pendingDeletion.item;
      if (node.kind === 'project') library.deleteProject(node.id);
      else library.deleteFolder(node);

      // Si estábamos mirando dentro de lo que acaba de desaparecer, subimos al
      // nivel de encima en lugar de quedarnos en un filtro fantasma.
      const path = pathTo(tree, node.key);
      if (path.some((step) => step.key === filterKey(activeFilter))) {
        const parent = path.at(-2);
        setActiveFilter(
          parent
            ? parent.kind === 'project'
              ? { type: 'project', projectId: parent.id }
              : { type: 'folder', projectId: parent.projectId, folderId: parent.id }
            : { type: 'all' }
        );
      }
      toast({ title: node.kind === 'project' ? 'Carpeta principal eliminada' : 'Carpeta eliminada' });
    } else {
      library.deleteItem(pendingDeletion.kind, pendingDeletion.item.id);
      toast({
        title: pendingDeletion.kind === 'prompt' ? 'Prompt eliminado' : 'Enlace eliminado',
      });
    }

    setPendingDeletion(null);
  }, [pendingDeletion, library, tree, activeFilter, toast]);

  const moveTo = useCallback(
    (kind: ItemKind, itemId: string, location: Location) => {
      library.moveTo(kind, itemId, location);
      toast({ title: 'Recurso organizado' });
    },
    [library, toast]
  );

  /** Guarda lo que devuelve el formulario, creando o editando según el caso. */
  const saveFolder = useCallback(
    (input: FolderInput) => {
      if (!folderDialog) return;

      if (folderDialog.mode === 'edit') {
        library.updateNode(folderDialog.node, input);
        toast({ title: folderDialog.node.kind === 'project' ? 'Carpeta principal actualizada' : 'Carpeta actualizada' });
      } else {
        library.createNode(input);
        toast({ title: input.parent === 'none' ? 'Carpeta principal creada' : 'Subcarpeta creada' });
      }
    },
    [folderDialog, library, toast]
  );

  /** Mueve un elemento una posición arriba o abajo dentro de la lista visible. */
  const step = useCallback(
    (kind: ItemKind, list: { id: string; order: number }[], index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return undefined;
      return () => library.reorder(kind, list, index, target);
    },
    [library]
  );

  const folderCopy = useMemo(() => {
    if (!folderDialog) return null;

    if (folderDialog.mode === 'edit') {
      const { node } = folderDialog;
      const parent = node.kind === 'project' ? NO_SELECTION : pathTo(tree, node.key).at(-2)?.key;
      return {
        title: node.kind === 'project' ? 'Editar carpeta principal' : 'Editar carpeta',
        body:
          node.kind === 'project'
            ? 'Una carpeta principal no puede moverse dentro de otra.'
            : 'Si la cambias de sitio, se muda con todo lo que contiene.',
        submitLabel: 'Guardar',
        lockParent: node.kind === 'project',
        moving: node.kind === 'folder' ? node : undefined,
        initial: {
          name: node.name,
          description: node.description,
          parent: parent ?? NO_SELECTION,
        },
      };
    }

    return {
      title: folderDialog.parent === NO_SELECTION ? 'Nueva carpeta principal' : 'Nueva subcarpeta',
      body: 'Déjala como principal o elige dentro de qué carpeta va.',
      submitLabel: 'Crear',
      lockParent: false,
      moving: undefined,
      initial: { name: '', description: null, parent: folderDialog.parent },
    };
  }, [folderDialog, tree]);

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
    const node = pendingDeletion.item;
    if (node.kind === 'project') {
      return {
        title: '¿Eliminar carpeta principal?',
        body: `Se eliminará «${node.name}» y todas sus subcarpetas. Los prompts y enlaces que contengan no se borran: pasarán a «Sin carpeta».`,
        action: 'Eliminar',
      };
    }
    return {
      title: '¿Eliminar carpeta?',
      body: `Se eliminará «${node.name}» y sus subcarpetas. Lo que contengan no se borra: subirá al nivel de encima.`,
      action: 'Eliminar',
    };
  }, [pendingDeletion]);

  /**
   * Subcarpetas que se muestran como tarjetas: las hijas directas de donde
   * estás. En «Todos» y en «Sin carpeta» no hay nada que enseñar.
   */
  const visibleFolders = activeNode?.children ?? [];

  /** Camino hasta la carpeta abierta, para las migas de pan. */
  const breadcrumb = useMemo(
    () => (activeNode ? pathTo(tree, activeNode.key) : []),
    [tree, activeNode]
  );


  /** Mueve un recurso a la ubicación sobre la que se ha soltado. */
  const handleDropOnTarget = useCallback(
    (kind: ItemKind, itemId: string, encodedLocation: string) => {
      const source = kind === 'prompt' ? prompts : links;
      const item = source.find((candidate) => candidate.id === itemId);
      if (!item) return;

      const destination = decodeLocation(encodedLocation, tree);
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
    [prompts, links, tree, library, toast]
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
          tree={tree}
          counts={counts}
          activeFilter={activeFilter}
          onSelect={setActiveFilter}
          onCreateRoot={() => setFolderDialog({ mode: 'create', parent: NO_SELECTION })}
          onCreateChild={(parent) => setFolderDialog({ mode: 'create', parent: parent.key })}
          onEdit={(node) => setFolderDialog({ mode: 'edit', node })}
          onDelete={(node) => setPendingDeletion({ kind: 'node', item: node })}
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

          {breadcrumb.length > 0 && (
            <BreadcrumbNav path={breadcrumb} onSelect={setActiveFilter} />
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
                    <FolderTree className="h-4 w-4" /> Subcarpetas ({visibleFolders.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleFolders.map((node) => (
                      <FolderCard
                        key={node.key}
                        node={node}
                        count={counts[node.key] ?? 0}
                        onOpen={() =>
                          setActiveFilter({
                            type: 'folder',
                            projectId: node.projectId,
                            folderId: node.id,
                          })
                        }
                        onEdit={() => setFolderDialog({ mode: 'edit', node })}
                        onDelete={() => setPendingDeletion({ kind: 'node', item: node })}
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
                          tree={tree}
                          onEdit={setEditingLink}
                          onDelete={(item) => setPendingDeletion({ kind: 'link', item })}
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
                          tree={tree}
                          onEdit={setEditingPrompt}
                          onDelete={(item) => setPendingDeletion({ kind: 'prompt', item })}
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
        <Button
          size="icon"
          className="h-16 w-16 rounded-full bg-violet-600 shadow-2xl hover:bg-violet-700"
          onClick={() => setFolderDialog({ mode: 'create', parent: NO_SELECTION })}
        >
          <FolderPlus className="h-8 w-8 text-white" />
          <span className="sr-only">Crear una carpeta</span>
        </Button>

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
              tree={tree}
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
              tree={tree}
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
              tree={tree}
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
              tree={tree}
              onSave={(input, id) => {
                library.saveLink(input, id);
                toast({ title: 'Enlace actualizado' });
              }}
              onClose={() => setEditingLink(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!folderDialog} onOpenChange={(open) => !open && setFolderDialog(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{folderCopy?.title}</DialogTitle>
            <DialogDescription>{folderCopy?.body}</DialogDescription>
          </DialogHeader>
          {folderDialog && folderCopy && (
            <FolderForm
              tree={tree}
              moving={folderCopy.moving}
              initial={folderCopy.initial}
              lockParent={folderCopy.lockParent}
              submitLabel={folderCopy.submitLabel}
              onSave={saveFolder}
              onClose={() => setFolderDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

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
