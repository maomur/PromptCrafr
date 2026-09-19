'use client';

import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';

import AppHeader from '@/components/layout/app-header';
import BackupMenu from '@/features/backup/components/backup-menu';
import FolderDialog, { type FolderRequest } from '@/features/folders/components/folder-dialog';
import FolderTreeSidebar from '@/features/folders/components/folder-tree-sidebar';
import { decodeLocation, pathTo, type TreeNode } from '@/features/folders/services/tree';
import { filterKey, type FolderInput, type LibraryFilter, type Location } from '@/features/folders/types';
import BreadcrumbNav from '@/features/library/components/breadcrumb-nav';
import ConfirmDeleteDialog, { type Deletion } from '@/features/library/components/confirm-delete-dialog';
import CreateButtons from '@/features/library/components/create-buttons';
import EmptyState from '@/features/library/components/empty-state';
import ItemDialogs from '@/features/library/components/item-dialogs';
import LibraryContent from '@/features/library/components/library-content';
import LibraryToolbar from '@/features/library/components/library-toolbar';
import StorageAlert from '@/features/library/components/storage-alert';
import { useLibrary } from '@/features/library/hooks/use-library';
import { ALL_CATEGORIES, locationOf, useLibraryView, type CategoryFilter } from '@/features/library/hooks/use-library-view';
import { csvFileName, downloadCsv, promptsToCsv } from '@/features/library/services/csv';
import type { ItemKind } from '@/features/library/services/mutations';
import type { Sortable } from '@/features/library/services/ordering';
import type { Link, Prompt } from '@/features/library/types';
import { NO_SELECTION } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

/**
 * Pantalla principal de la biblioteca.
 *
 * Coordina y nada más: los datos y las operaciones vienen de `useLibrary`, lo
 * que se ve de `useLibraryView`, y cada trozo de interfaz de su propio
 * componente. Aquí sólo queda decidir qué diálogo está abierto y conectar unas
 * piezas con otras.
 */
export default function LibraryPage() {
  const { toast } = useToast();
  const library = useLibrary();
  const { tree, counts, prompts, links } = library;
  const view = useLibraryView(tree, prompts, links);

  const [folderRequest, setFolderRequest] = useState<FolderRequest | null>(null);
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  const [creating, setCreating] = useState<'prompt' | 'link' | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const closeItemDialogs = useCallback(() => {
    setCreating(null);
    setEditingPrompt(null);
    setEditingLink(null);
  }, []);

  const saveFolder = useCallback(
    (input: FolderInput) => {
      if (!folderRequest) return;

      if (folderRequest.mode === 'edit') {
        library.updateNode(folderRequest.node, input);
        toast({ title: 'Carpeta actualizada' });
      } else {
        library.createNode(input);
        toast({
          title: input.parent === NO_SELECTION ? 'Carpeta principal creada' : 'Subcarpeta creada',
        });
      }
    },
    [folderRequest, library, toast]
  );

  const confirmDeletion = useCallback(() => {
    if (!deletion) return;

    if (deletion.kind === 'node') {
      const node = deletion.item;
      if (node.kind === 'project') library.deleteProject(node.id);
      else library.deleteFolder(node);

      // Si estábamos mirando dentro de lo que acaba de desaparecer, subimos al
      // nivel de encima en lugar de quedarnos en un filtro fantasma.
      const path = pathTo(tree, node.key);
      if (path.some((step) => step.key === filterKey(view.filter))) {
        const parent = path.at(-2);
        view.setFilter(toFilter(parent));
      }
      toast({ title: 'Carpeta eliminada' });
    } else {
      library.deleteItem(deletion.kind, deletion.item.id);
      toast({ title: deletion.kind === 'prompt' ? 'Prompt eliminado' : 'Enlace eliminado' });
    }

    setDeletion(null);
  }, [deletion, library, tree, view, toast]);

  const moveTo = useCallback(
    (kind: ItemKind, id: string, location: Location) => {
      library.moveTo(kind, id, location);
      toast({ title: 'Recurso organizado' });
    },
    [library, toast]
  );

  /** Mueve un recurso a la ubicación sobre la que se ha soltado. */
  const dropOnTarget = useCallback(
    (kind: ItemKind, id: string, encoded: string) => {
      const item = (kind === 'prompt' ? prompts : links).find((candidate) => candidate.id === id);
      if (!item) return;

      const destination = decodeLocation(encoded, tree);
      const current = locationOf(item);

      // Soltar algo donde ya estaba no merece ni una escritura ni un aviso.
      if (current.projectId === destination.projectId && current.folderId === destination.folderId) {
        return;
      }

      library.moveTo(kind, id, destination);
      toast({ title: 'Recurso movido' });
    },
    [prompts, links, tree, library, toast]
  );

  const reorder = useCallback(
    (kind: ItemKind, visible: Sortable[], from: number, to: number) =>
      library.reorder(kind, visible, from, to),
    [library]
  );

  /**
   * Exporta la biblioteca entera, no lo que se esté viendo: el botón dice
   * cuántos prompts saldrán, así que el filtro activo no debería cambiarlo.
   */
  const exportPrompts = useCallback(() => {
    downloadCsv(csvFileName(), promptsToCsv(prompts, tree));
    toast({
      title: 'Prompts exportados',
      description: `${prompts.length} ${prompts.length === 1 ? 'prompt' : 'prompts'} en un archivo CSV.`,
    });
  }, [prompts, tree, toast]);

  return (
    <div className="relative min-h-[80vh]">
      <AppHeader>
        <BackupMenu state={library} onImport={library.replaceAll} />
      </AppHeader>

      <div className="flex flex-col gap-8 md:flex-row">
        <FolderTreeSidebar
          tree={tree}
          counts={counts}
          activeFilter={view.filter}
          onSelect={view.setFilter}
          onCreateRoot={() => setFolderRequest({ mode: 'create', parent: NO_SELECTION })}
          onCreateChild={(parent) => setFolderRequest({ mode: 'create', parent: parent.key })}
          onEdit={(node) => setFolderRequest({ mode: 'edit', node })}
          onDelete={(node) => setDeletion({ kind: 'node', item: node })}
        />

        <main className="flex-1 pb-24">
          <StorageAlert error={library.error} />

          {!library.isLoading && (
            <LibraryToolbar
              query={view.query}
              onQueryChange={view.setQuery}
              category={view.category}
              onCategoryChange={(value) => view.setCategory(value as CategoryFilter)}
              allCategoriesLabel={ALL_CATEGORIES}
              resultCount={view.visiblePrompts.length + view.visibleLinks.length}
              onExport={exportPrompts}
              exportCount={prompts.length}
            />
          )}

          {view.breadcrumb.length > 0 && (
            <BreadcrumbNav path={view.breadcrumb} onSelect={view.setFilter} />
          )}

          {library.isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 pt-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cargando biblioteca...</p>
            </div>
          ) : view.isEmpty ? (
            <EmptyState
              isFiltered={prompts.length + links.length > 0}
              searchQuery={view.query}
              onCreatePrompt={() => setCreating('prompt')}
              onClearFilters={view.clearFilters}
            />
          ) : (
            <LibraryContent
              tree={tree}
              counts={counts}
              folders={view.visibleFolders}
              prompts={view.visiblePrompts}
              links={view.visibleLinks}
              onSelectFilter={view.setFilter}
              onEditFolder={(node) => setFolderRequest({ mode: 'edit', node })}
              onDeleteFolder={(node) => setDeletion({ kind: 'node', item: node })}
              onEditPrompt={setEditingPrompt}
              onDeletePrompt={(item) => setDeletion({ kind: 'prompt', item })}
              onEditLink={setEditingLink}
              onDeleteLink={(item) => setDeletion({ kind: 'link', item })}
              onMoveTo={moveTo}
              onDropOnTarget={dropOnTarget}
              onReorder={reorder}
            />
          )}
        </main>
      </div>

      <CreateButtons
        onCreateFolder={() => setFolderRequest({ mode: 'create', parent: NO_SELECTION })}
        onCreateLink={() => setCreating('link')}
        onCreatePrompt={() => setCreating('prompt')}
      />

      <ItemDialogs
        tree={tree}
        creating={creating}
        editingPrompt={editingPrompt}
        editingLink={editingLink}
        onSavePrompt={(input, id) => {
          library.savePrompt(input, id);
          toast({ title: id ? 'Prompt actualizado' : 'Prompt creado' });
        }}
        onSaveLink={(input, id) => {
          library.saveLink(input, id);
          toast({ title: id ? 'Enlace actualizado' : 'Enlace guardado' });
        }}
        onClose={closeItemDialogs}
      />

      <FolderDialog
        request={folderRequest}
        tree={tree}
        onSave={saveFolder}
        onClose={() => setFolderRequest(null)}
      />

      <ConfirmDeleteDialog
        deletion={deletion}
        onConfirm={confirmDeletion}
        onClose={() => setDeletion(null)}
      />
    </div>
  );
}

/** Filtro correspondiente a un nodo del árbol, o «Todos» si no hay ninguno. */
function toFilter(node: TreeNode | undefined): LibraryFilter {
  if (!node) return { type: 'all' };
  return node.kind === 'project'
    ? { type: 'project', projectId: node.id }
    : { type: 'folder', projectId: node.projectId, folderId: node.id };
}
