import type { Folder, Project } from '@/features/folders/types';
import type { LibraryState, Link, Prompt } from '@/features/library/types';

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

/**
 * Lo que sale de leer un archivo, con lo que hubo que ajustar.
 *
 * Importar puede cambiar los datos —descartar repetidos, subir carpetas de
 * nivel—, y eso hay que poder decírselo al usuario antes de que confirme, no
 * después.
 */
export type ImportResult = {
  state: LibraryState;
  /** Registros descartados por repetir identificador. */
  discarded: number;
  /** Carpetas reenganchadas por exceder el límite de profundidad. */
  flattened: number;
};
