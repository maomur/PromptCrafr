'use client';

import { useCallback, useMemo } from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Folder as FolderIcon, GripVertical, Link as LinkIcon } from 'lucide-react';
import ItemActions from '@/features/library/components/item-actions';
import { type Location } from '@/features/folders/types';
import { type Link } from '@/features/library/types';
import { findNode, type TreeNode } from '@/features/folders/services/tree';
import { copyToClipboard } from '@/lib/clipboard';
import { formatRelativeDate } from '@/lib/dates';
import { useToast } from '@/hooks/use-toast';

interface LinkCardProps {
  link: Link;
  tree: TreeNode[];
  onDelete: (link: Link) => void;
  onEdit: (link: Link) => void;
  /** Apunta que se ha copiado, que es lo que cuenta como usarlo. */
  onUse: () => void;
  onMoveTo: (location: Location) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/** Muestra "ejemplo.com/ruta" en lugar de la URL completa cuando es muy larga. */
function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    return url;
  }
}

export default function LinkCard({
  link,
  tree,
  onDelete,
  onEdit,
  onUse,
  onMoveTo,
  onMoveUp,
  onMoveDown,
}: LinkCardProps) {
  const { toast } = useToast();

  // La etiqueta muestra la carpeta concreta donde vive el recurso, no su raíz:
  // con tres niveles, saber sólo el proyecto dice bastante poco.
  const folder = useMemo(() => {
    const key = link.folderId ? `folder:${link.folderId}` : `project:${link.projectId}`;
    return link.projectId ? findNode(tree, key) : undefined;
  }, [tree, link.projectId, link.folderId]);

  const copyUrl = useCallback(async () => {
    const copied = await copyToClipboard(link.url);
    if (copied) onUse();
    toast(
      copied
        ? { title: 'Enlace copiado', description: 'La URL está en tu portapapeles.' }
        : {
            variant: 'destructive',
            title: 'No se ha podido copiar',
            description: 'Tu navegador ha bloqueado el acceso al portapapeles.',
          }
    );
  }, [link.url, onUse, toast]);

  const handleCardClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('button, a, [role="menuitem"], [role="menu"], .drag-handle')) return;
      void copyUrl();
    },
    [copyUrl]
  );

  return (
    <Card
      onClick={handleCardClick}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border-border/20 bg-card shadow-md transition-all duration-300 hover:shadow-lg"
    >
      <div className="drag-handle absolute right-0 top-0 p-3 z-10" aria-hidden="true">
        <GripVertical className="h-5 w-5 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
      </div>

      <CardHeader className="space-y-4 pt-6 md:pt-10">
        <div className="flex flex-wrap items-center gap-2 pr-10">
          {folder && (
            <Badge
              variant="secondary"
              className="flex h-6 items-center gap-1.5 border-none bg-muted px-2.5 text-[11px] font-normal text-muted-foreground"
            >
              <FolderIcon className="h-4 w-4" />
              {folder.name}
            </Badge>
          )}
          <div className="flex items-center gap-1.5">
            <div className="rounded-md bg-orange-100 p-1 dark:bg-orange-900/40">
              <LinkIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            {link.category && (
              <Badge
                variant="secondary"
                className="h-6 border-orange-100 bg-orange-50 px-2.5 py-0 text-[11px] font-medium text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/30 dark:text-orange-300"
              >
                {link.category}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <CardTitle className="truncate text-base font-bold">
            {link.title || 'Enlace sin título'}
          </CardTitle>
          {link.description && (
            <CardDescription className="line-clamp-2 text-[11px] leading-relaxed">
              {link.description}
            </CardDescription>
          )}
          <p className="truncate pt-1 font-mono text-[10px] text-muted-foreground opacity-60" title={link.url}>
            {displayUrl(link.url)}
          </p>
        </div>
      </CardHeader>

      <div className="flex-grow" />

      <CardFooter className="flex items-center justify-between pb-4 pt-0 text-[10px] text-muted-foreground">
        <span className="opacity-70">{formatRelativeDate(link.createdAt)}</span>
        <ItemActions
          label="enlace"
          tree={tree}
          location={{ projectId: link.projectId ?? null, folderId: link.folderId ?? null }}
          onCopy={copyUrl}
          onEdit={() => onEdit(link)}
          onDelete={() => onDelete(link)}
          onMoveTo={onMoveTo}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/30"
            asChild
          >
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Abrir enlace en una pestaña nueva</span>
            </a>
          </Button>
        </ItemActions>
      </CardFooter>
    </Card>
  );
}
