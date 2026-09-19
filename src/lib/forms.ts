/** Piezas de validación que comparten los formularios de todas las features. */

import { z } from 'zod';
import { NO_SELECTION } from '@/lib/constants';

/** Los <Select> nunca guardan "", así que usan el centinela `none`. */
export const selectValue = z.string().min(1);

/** Traduce el centinela de los <Select> al `null` que se guarda. */
export function fromSelect(value: string): string | null {
  return value === NO_SELECTION ? null : value;
}

/** Traduce lo guardado al valor que espera un <Select>. */
export function toSelect(value: string | null | undefined): string {
  return value ?? NO_SELECTION;
}
