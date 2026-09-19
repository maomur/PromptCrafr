/**
 * Búsqueda de texto sobre la biblioteca.
 *
 * La biblioteca entera ya está en memoria, así que buscar no cuesta ninguna
 * consulta a la base.
 */

/**
 * Deja un texto en su forma comparable: sin mayúsculas y sin tildes.
 *
 * Lo segundo importa en español. Quien busca "video" espera encontrar "vídeo",
 * y quien busca "diseno" a las cuatro de la mañana también.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Parte la consulta en palabras sueltas, ya normalizadas. */
export function parseQuery(query: string): string[] {
  const normalized = normalizeText(query).trim();
  return normalized ? normalized.split(/\s+/) : [];
}

/**
 * Comprueba si un recurso encaja con la búsqueda.
 *
 * Todas las palabras tienen que aparecer, pero pueden estar repartidas entre
 * campos distintos: "logo azul" encuentra un prompt titulado "Logo" cuya
 * descripción menciona el azul.
 */
export function matchesQuery(fields: (string | null | undefined)[], terms: string[]): boolean {
  if (terms.length === 0) return true;

  const haystack = normalizeText(fields.filter(Boolean).join(' '));
  return terms.every((term) => haystack.includes(term));
}
