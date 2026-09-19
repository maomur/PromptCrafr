'use client';

import { Fragment } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NO_SELECTION, type Folder, type Project } from '@/lib/definitions';

interface LocationSelectProps {
  projects: Project[];
  folders: Folder[];
  /** Valor codificado con `encodeLocation`. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

/**
 * Elige dónde archivar un recurso: suelto, en un proyecto o en una de sus
 * carpetas.
 *
 * Es un único desplegable con las carpetas sangradas bajo su proyecto, en
 * lugar de dos controles encadenados, porque la jerarquía tiene sólo dos
 * niveles y así se ve entera de un vistazo.
 */
export default function LocationSelect({
  projects,
  folders,
  value,
  onChange,
  id,
}: LocationSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Selecciona una ubicación" />
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={4} className="max-h-72">
        <SelectItem value={NO_SELECTION}>Sin proyecto (General)</SelectItem>

        {projects.map((project) => {
          const projectFolders = folders.filter((folder) => folder.projectId === project.id);
          return (
            <Fragment key={project.id}>
              <SelectSeparator />
              <SelectItem value={`project:${project.id}`}>{project.name}</SelectItem>
              {projectFolders.map((folder) => (
                <SelectItem key={folder.id} value={`folder:${folder.id}`} className="pl-12">
                  {folder.name}
                </SelectItem>
              ))}
            </Fragment>
          );
        })}
      </SelectContent>
    </Select>
  );
}
