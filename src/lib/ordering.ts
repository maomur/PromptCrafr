/**
 * Posiciones de los recursos dentro de una lista.
 *
 * Cada prompt y cada enlace llevan un `order`; mayor valor, más arriba. La
 * lógica vive aparte del hook porque es aritmética pura y conviene poder
 * probarla sin montar React ni Firestore.
 */

export type Sortable = { id: string; order: number };

/** Mueve un elemento de una posición a otra devolviendo un array nuevo. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Posición para un elemento nuevo: siempre en lo alto de la lista. */
export function nextOrder(items: Sortable[]): number {
  return items.reduce((max, item) => Math.max(max, item.order ?? 0), 0) + 1;
}

/**
 * Reparte las posiciones existentes entre los elementos ya reordenados.
 *
 * Reutiliza los valores de `order` que ya tenían en lugar de renumerar desde
 * cero: así los recursos que el filtro activo esconde conservan su posición
 * relativa respecto al resto de la biblioteca. Devuelve sólo lo que cambia,
 * para no escribir en Firestore documentos que se quedan igual.
 */
export function assignOrders<T extends Sortable>(reordered: T[]): Map<string, number> {
  const slots = reordered.map((item) => item.order ?? 0).sort((a, b) => b - a);

  // Valores duplicados o a cero significan datos antiguos: renumeramos.
  const isUsable = new Set(slots).size === slots.length;
  const finalSlots = isUsable ? slots : reordered.map((_, index) => reordered.length - index);

  const changes = new Map<string, number>();
  reordered.forEach((item, index) => {
    if (item.order !== finalSlots[index]) changes.set(item.id, finalSlots[index]);
  });
  return changes;
}
