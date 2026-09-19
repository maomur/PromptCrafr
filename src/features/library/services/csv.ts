import { format, parseISO } from 'date-fns';
import { type Prompt } from '@/features/library/types';
import { pathTo, type TreeNode } from '@/features/folders/services/tree';

/**
 * Exportación a CSV.
 *
 * Sigue el RFC 4180: comillas dobles para lo que lleve comas, comillas o
 * saltos de línea, y CRLF entre filas. Importa porque el contenido de un
 * prompt casi siempre tiene saltos de línea, y un CSV mal escapado los
 * convierte en filas nuevas que descuadran la hoja entera.
 */

/** Entrecomilla un campo sólo si lo necesita, doblando las comillas de dentro. */
function escapeField(value: string): string {
  return /["\r\n,]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Convierte una tabla en texto CSV. */
export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(escapeField).join(',')).join('\r\n');
}

/** Fecha en un formato que las hojas de cálculo ordenan bien. */
function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '';

  const date = parseISO(isoDate);
  return Number.isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd HH:mm');
}

/** Ruta legible de la carpeta donde vive un prompt: «Trabajo / Nómina». */
function locationLabel(prompt: Prompt, tree: TreeNode[]): string {
  if (!prompt.projectId) return '';

  const key = prompt.folderId ? `folder:${prompt.folderId}` : `project:${prompt.projectId}`;
  return pathTo(tree, key)
    .map((node) => node.name)
    .join(' / ');
}

export const CSV_HEADERS = [
  'Título',
  'Descripción',
  'Contenido',
  'Categoría',
  'Carpeta',
  'Creado',
  'Actualizado',
] as const;

/** Arma la tabla completa, cabecera incluida. */
export function promptsToCsv(prompts: Prompt[], tree: TreeNode[]): string {
  const rows: string[][] = [
    [...CSV_HEADERS],
    ...prompts.map((prompt) => [
      prompt.title ?? '',
      prompt.description ?? '',
      prompt.content ?? '',
      prompt.category ?? '',
      locationLabel(prompt, tree),
      formatDate(prompt.createdAt),
      formatDate(prompt.updatedAt),
    ]),
  ];

  return toCsv(rows);
}

/** Nombre del fichero, con la fecha para no pisar exportaciones anteriores. */
export function csvFileName(date = new Date()): string {
  return `promptcraft-prompts-${format(date, 'yyyy-MM-dd')}.csv`;
}

/**
 * Descarga el CSV desde el navegador.
 *
 * Lleva delante un BOM de UTF-8: sin él, Excel abre el fichero en la
 * codificación del sistema y destroza las tildes y las eñes.
 */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
