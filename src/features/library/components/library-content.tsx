'use client';

import { FolderTree, Link as LinkIcon, Sparkles } from 'lucide-react';
import FolderCard from '@/features/folders/components/folder-card';
import type { TreeNode } from '@/features/folders/services/tree';
import type { LibraryFilter, Location } from '@/features/folders/types';
import LinkCard from '@/features/library/components/link-card';
import PromptCard from '@/features/library/components/prompt-card';
import SortableGrid from '@/features/library/components/sortable-grid';
import type { ItemKind } from '@/features/library/services/mutations';
import type { Sortable } from '@/features/library/services/ordering';
import type { Link, Prompt } from '@/features/library/types';

interface LibraryContentProps {
  tree: TreeNode[];
  counts: Record<string, number>;
  folders: TreeNode[];
  prompts: Prompt[];
  links: Link[];
  onSelectFilter: (filter: LibraryFilter) => void;
  onEditFolder: (node: TreeNode) => void;
  onDeleteFolder: (node: TreeNode) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (prompt: Prompt) => void;
  onEditLink: (link: Link) => void;
  onDeleteLink: (link: Link) => void;
  onMoveTo: (kind: ItemKind, id: string, location: Location) => void;
  onDropOnTarget: (kind: ItemKind, id: string, location: string) => void;
  onReorder: (kind: ItemKind, visible: Sortable[], from: number, to: number) => void;
}

/**
 * Lo que se ve al entrar en una carpeta: primero sus subcarpetas, y debajo
 * todo su contenido, incluido el que vive más abajo en el árbol.
 */
export default function LibraryContent({
  tree,
  counts,
  folders,
  prompts,
  links,
  onSelectFilter,
  onEditFolder,
  onDeleteFolder,
  onEditPrompt,
  onDeletePrompt,
  onEditLink,
  onDeleteLink,
  onMoveTo,
  onDropOnTarget,
  onReorder,
}: LibraryContentProps) {
  /** Mueve un elemento una posición arriba o abajo dentro de la lista visible. */
  const step = (kind: ItemKind, list: Sortable[], index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return undefined;
    return () => onReorder(kind, list, index, target);
  };

  return (
    <div className="space-y-8">
      {folders.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <FolderTree className="h-4 w-4" /> Subcarpetas ({folders.length})
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((node) => (
              <FolderCard
                key={node.key}
                node={node}
                count={counts[node.key] ?? 0}
                onOpen={() =>
                  onSelectFilter({ type: 'folder', projectId: node.projectId, folderId: node.id })
                }
                onEdit={() => onEditFolder(node)}
                onDelete={() => onDeleteFolder(node)}
              />
            ))}
          </div>
        </section>
      )}

      {links.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
            <LinkIcon className="h-4 w-4" /> Enlaces ({links.length})
          </h2>
          <SortableGrid
            items={links}
            group="links"
            onReorder={(from, to) => onReorder('link', links, from, to)}
            onDropOnTarget={(id, location) => onDropOnTarget('link', id, location)}
            renderItem={(item) => {
              const index = links.indexOf(item);
              return (
                <LinkCard
                  link={item}
                  tree={tree}
                  onEdit={onEditLink}
                  onDelete={onDeleteLink}
                  onMoveTo={(location) => onMoveTo('link', item.id, location)}
                  onMoveUp={step('link', links, index, -1)}
                  onMoveDown={step('link', links, index, 1)}
                />
              );
            }}
          />
        </section>
      )}

      {prompts.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-4 w-4" /> Prompts ({prompts.length})
          </h2>
          <SortableGrid
            items={prompts}
            group="prompts"
            onReorder={(from, to) => onReorder('prompt', prompts, from, to)}
            onDropOnTarget={(id, location) => onDropOnTarget('prompt', id, location)}
            renderItem={(item) => {
              const index = prompts.indexOf(item);
              return (
                <PromptCard
                  prompt={item}
                  tree={tree}
                  onEdit={onEditPrompt}
                  onDelete={onDeletePrompt}
                  onMoveTo={(location) => onMoveTo('prompt', item.id, location)}
                  onMoveUp={step('prompt', prompts, index, -1)}
                  onMoveDown={step('prompt', prompts, index, 1)}
                />
              );
            }}
          />
        </section>
      )}
    </div>
  );
}
