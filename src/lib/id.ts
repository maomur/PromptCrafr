/**
 * Identificadores de los registros.
 *
 * Antes los ponía el backend al crear cada documento; ahora los genera el
 * navegador. `randomUUID` sólo existe en contextos seguros, así que hay un
 * plan B para que la aplicación no se caiga al abrirla por IP en la red local.
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
