'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Folder as FolderIcon, Folders } from 'lucide-react';
import { NO_SELECTION } from '@/lib/constants';
import { flatten, type TreeNode } from '@/features/folders/tree';

interface LocationSelectProps {
  tree: TreeNode[];
  /** Clave del nodo (`project:<id>` / `folder:<id>`) o `none`. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

/**
 * Elige dónde archivar un recurso dentro del árbol de carpetas.
 *
 * Es un único desplegable con toda la jerarquía sangrada, en lugar de varios
 * controles encadenados: con tres niveles el encadenamiento obligaría a tres
 * clics para llegar al fondo.
 */
export default function LocationSelect({ tree, value, onChange, id }: LocationSelectProps) {
  const nodes = flatten(tree);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Selecciona una ubicación" />
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={4} className="max-h-72">
        <SelectItem value={NO_SELECTION}>
          <span className="flex items-center gap-2">
            <Folders className="h-4 w-4" />
            Sin carpeta
          </span>
        </SelectItem>
        {nodes.length > 0 && <SelectSeparator />}

        {nodes.map((node) => (
          <SelectItem
            key={node.key}
            value={node.key}
            style={{ paddingLeft: `${(node.depth - 1) * 16 + 32}px` }}
          >
            <span className="flex items-center gap-2">
              <FolderIcon className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate">{node.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
