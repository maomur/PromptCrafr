import { MAX_DEPTH } from '@/features/folders/types';
import type { Folder, Project } from '@/features/folders/types';
import { CSV_HEADERS } from '@/features/library/services/csv';
import { promptCategories, type Prompt, type PromptCategory } from '@/features/library/types';
import type { ImportResult } from '@/features/backup/types';
import { newId } from '@/lib/id';

/**
 * Importación desde el CSV que exporta la propia aplicación.
 *
 * El CSV se pensó como salida hacia una hoja de cálculo, pero ofrecer
 * «descargar CSV» y aceptar sólo JSON al volver deja al usuario con un archivo
 * que la aplicación no sabe leer. Aquí se cierra ese círculo.
 *
 * Un CSV trae menos información que una copia en JSON: no lleva enlaces, ni
 * identificadores, ni descripciones de carpeta. La jerarquía se reconstruye a
 * partir de la columna de ruta.
 */

/**
 * Parte un CSV en filas y campos siguiendo el RFC 4180.
 *
 * No vale con cortar por comas y saltos de línea: el contenido de un prompt
 * casi siempre lleva saltos dentro de un campo entrecomillado, y partir por
 * ellos convertiría un prompt en varias filas rotas.
 */
export function parseCsvRows(text: string): string[][] {
  // Excel antepone un BOM; si se queda, la primera cabecera no coincide.
  const source = text.replace(/^﻿/, '');

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (quoted) {
      if (char !== '"') {
        field += char;
      } else if (source[i + 1] === '"') {
        // Dos comillas seguidas dentro de un campo son una comilla literal.
        field += '"';
        i += 1;
      } else {
        quoted = false;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      // Acepta CRLF y LF indistintamente.
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Una fila con un único campo vacío es una línea en blanco del final.
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

/** Compara cabeceras sin que estorben tildes, mayúsculas ni espacios. */
function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/** Localiza cada columna por su nombre, en el orden que venga. */
function indexColumns(header: string[]): Record<string, number> {
  const found: Record<string, number> = {};
  header.forEach((cell, index) => {
    found[normalizeHeader(cell)] = index;
  });
  return found;
}

/** Fecha del CSV («2026-09-19 12:30») a ISO. */
function toIso(value: string | undefined): string {
  const text = (value ?? '').trim();
  if (!text) return new Date().toISOString();

  const parsed = new Date(text.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function toCategory(value: string | undefined): PromptCategory | null {
  const text = (value ?? '').trim();
  return promptCategories.includes(text as PromptCategory) ? (text as PromptCategory) : null;
}

/**
 * Reconstruye el árbol a partir de las rutas de la columna «Carpeta».
 *
 * «Trabajo / Nómina / Recibos» crea la carpeta principal, su subcarpeta y la
 * de dentro, reutilizando las que ya se hayan creado para otra fila.
 */
class TreeBuilder {
  readonly projects: Project[] = [];
  readonly folders: Folder[] = [];
  private readonly byPath = new Map<string, { projectId: string; folderId: string | null }>();

  private createdAt = new Date().toISOString();

  /** Devuelve la ubicación de una ruta, creando lo que falte. */
  resolve(path: string): { projectId: string | null; folderId: string | null } {
    const parts = path
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)
      // Todo lo que exceda la profundidad admitida se queda en el último nivel.
      .slice(0, MAX_DEPTH);

    if (parts.length === 0) return { projectId: null, folderId: null };

    let key = '';
    let current: { projectId: string; folderId: string | null } | null = null;

    for (const [depth, name] of parts.entries()) {
      key = key ? `${key}/${name}` : name;
      const known = this.byPath.get(key);

      if (known) {
        current = known;
        continue;
      }

      if (depth === 0) {
        const project: Project = { id: newId(), name, description: null, createdAt: this.createdAt };
        this.projects.push(project);
        current = { projectId: project.id, folderId: null };
      } else {
        const folder: Folder = {
          id: newId(),
          name,
          description: null,
          projectId: current!.projectId,
          parentId: current!.folderId,
          createdAt: this.createdAt,
        };
        this.folders.push(folder);
        current = { projectId: folder.projectId, folderId: folder.id };
      }

      this.byPath.set(key, current);
    }

    return current!;
  }
}

/** ¿Tiene este texto pinta de ser el CSV que exporta la aplicación? */
export function looksLikeCsv(text: string): boolean {
  const first = text.replace(/^﻿/, '').split(/\r?\n/, 1)[0] ?? '';
  const columns = indexColumns(parseCsvRows(first)[0] ?? []);
  return normalizeHeader(CSV_HEADERS[0]) in columns && normalizeHeader(CSV_HEADERS[2]) in columns;
}

/** Convierte el CSV exportado en una biblioteca. */
export function parseCsvBackup(text: string): ImportResult {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    throw new Error('El archivo CSV no tiene filas de datos.');
  }

  const columns = indexColumns(rows[0]);
  const at = (cells: string[], header: string) => {
    const index = columns[normalizeHeader(header)];
    return index === undefined ? undefined : cells[index];
  };

  const tree = new TreeBuilder();
  const prompts: Prompt[] = [];
  const body = rows.slice(1);
  let discarded = 0;

  body.forEach((cells, index) => {
    const title = (at(cells, CSV_HEADERS[0]) ?? '').trim();
    const content = (at(cells, CSV_HEADERS[2]) ?? '').trim();

    if (!title || !content) {
      discarded += 1;
      return;
    }

    prompts.push({
      id: newId(),
      title,
      description: (at(cells, CSV_HEADERS[1]) ?? '').trim(),
      content,
      category: toCategory(at(cells, CSV_HEADERS[3])),
      createdAt: toIso(at(cells, CSV_HEADERS[5])),
      updatedAt: toIso(at(cells, CSV_HEADERS[6])),
      // El CSV sale ordenado de arriba abajo; conservamos ese orden.
      order: body.length - index,
      ...tree.resolve(at(cells, CSV_HEADERS[4]) ?? ''),
    });
  });

  if (prompts.length === 0) {
    throw new Error('No se ha encontrado ningún prompt en el CSV.');
  }

  return {
    state: { projects: tree.projects, folders: tree.folders, prompts, links: [] },
    discarded,
    flattened: 0,
  };
}
