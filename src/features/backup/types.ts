import type { Folder, Project } from '@/features/folders/types';
import type { Link, Prompt } from '@/features/library/types';

/**
 * Formato del archivo de copia de seguridad.
 *
 * `version` existe para poder cambiar el formato más adelante sin dejar
 * inservibles los archivos ya descargados: la importación podrá mirar el
 * número y decidir cómo leerlos.
 */
export const BACKUP_VERSION = 1;

export type Backup = {
  version: number;
  exportedAt: string;
  projects: Project[];
  folders: Folder[];
  prompts: Prompt[];
  links: Link[];
};
