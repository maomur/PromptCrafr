import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha ISO como "hace 3 días".
 *
 * `formatDistanceToNow` lanza una excepción con una fecha inválida, y basta un
 * documento antiguo sin `createdAt` para tumbar toda la lista, así que
 * devolvemos un texto neutro en ese caso.
 */
export function formatRelativeDate(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Fecha desconocida';

  const date = parseISO(isoDate);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';

  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}
