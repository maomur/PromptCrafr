'use client';

import { useCallback, useMemo } from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Flame,
  Folder as FolderIcon,
  GripVertical,
  Image as ImageIcon,
  Sparkles,
  Video,
} from 'lucide-react';
import ItemActions from '@/features/library/components/item-actions';
import { type Location } from '@/features/folders/types';
import { type Prompt } from '@/features/library/types';
import { findNode, type TreeNode } from '@/features/folders/services/tree';
import { copyToClipboard } from '@/lib/clipboard';
import { formatRelativeDate } from '@/lib/dates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PromptCardProps {
  prompt: Prompt;
  tree: TreeNode[];
  onDelete: (prompt: Prompt) => void;
  onEdit: (prompt: Prompt) => void;
  /** Apunta que se ha copiado, que es lo que cuenta como usarlo. */
  onUse: () => void;
  onMoveTo: (location: Location) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const categoryIcons = {
  Video: <Video className="mr-1.5 h-4 w-4" />,
  Imagen: <ImageIcon className="mr-1.5 h-4 w-4" />,
  Textos: <FileText className="mr-1.5 h-4 w-4" />,
  Otros: <Sparkles className="mr-1.5 h-4 w-4" />,
};

const categoryColors = {
  Video: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  Imagen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  Textos: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Otros: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300',
};

export default function PromptCard({
  prompt,
  tree,
  onDelete,
  onEdit,
  onUse,
  onMoveTo,
  onMoveUp,
  onMoveDown,
}: PromptCardProps) {
  const { toast } = useToast();

  // La etiqueta muestra la carpeta concreta donde vive el recurso, no su raíz:
  // con tres niveles, saber sólo el proyecto dice bastante poco.
  const folder = useMemo(() => {
    const key = prompt.folderId ? `folder:${prompt.folderId}` : `project:${prompt.projectId}`;
    return prompt.projectId ? findNode(tree, key) : undefined;
  }, [tree, prompt.projectId, prompt.folderId]);

  const copyContent = useCallback(async () => {
    const copied = await copyToClipboard(prompt.content);
    if (copied) onUse();
    toast(
      copied
        ? { title: 'Prompt copiado', description: 'El contenido está en tu portapapeles.' }
        : {
            variant: 'destructive',
            title: 'No se ha podido copiar',
            description: 'Tu navegador ha bloqueado el acceso al portapapeles.',
          }
    );
  }, [prompt.content, onUse, toast]);

  // Un clic en cualquier zona "muerta" de la tarjeta copia el prompt. Los
  // controles interactivos y el asa de arrastre quedan excluidos.
  const handleCardClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('button, a, [role="menuitem"], [role="menu"], .drag-handle')) return;
      void copyContent();
    },
    [copyContent]
  );

  return (
    <Card
      onClick={handleCardClick}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border-border/20 bg-card text-card-foreground shadow-md transition-all duration-300 hover:shadow-lg"
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
          {prompt.category && (
            <Badge
              variant="outline"
              className={cn(
                'flex h-6 shrink-0 items-center border-0 px-2.5 py-0 text-[11px] font-medium',
                categoryColors[prompt.category]
              )}
            >
              {categoryIcons[prompt.category]}
              {prompt.category}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <CardTitle className="truncate text-base font-bold tracking-tight">
            {prompt.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-[11px] leading-relaxed">
            {prompt.description}
          </CardDescription>
        </div>
      </CardHeader>

      <div className="flex-grow" />

      <CardFooter className="flex items-center justify-between pb-4 pt-0 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-2 opacity-70">
          {formatRelativeDate(prompt.createdAt)}
          {/* Sólo aparece si se ha usado: un «0 usos» en todas las tarjetas
              sería ruido en una biblioteca recién estrenada. */}
          {!!prompt.useCount && (
            <span className="flex items-center gap-1" title={`Copiado ${prompt.useCount} veces`}>
              <Flame className="h-3 w-3" />
              {prompt.useCount}
            </span>
          )}
        </span>
        <ItemActions
          label="prompt"
          tree={tree}
          location={{ projectId: prompt.projectId ?? null, folderId: prompt.folderId ?? null }}
          onCopy={copyContent}
          onEdit={() => onEdit(prompt)}
          onDelete={() => onDelete(prompt)}
          onMoveTo={onMoveTo}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </CardFooter>
    </Card>
  );
}
