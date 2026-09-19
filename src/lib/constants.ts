/** Valores compartidos por toda la aplicación. */

export const APP_NAME = 'PromptCraft';

export const APP_DESCRIPTION = 'Gestiona tus prompts creativos con facilidad.';

/** Color de marca (#007AFF), usado en el manifest y en la barra del navegador. */
export const BRAND_COLOR = '#007AFF';

/**
 * Iconos de la PWA, generados a partir de `public/icons/logo.svg`.
 * Dentro de la aplicación el logotipo se pinta con el componente <Logo />.
 */
export const APP_ICONS = {
  any192: '/icons/logo-192.png',
  any512: '/icons/logo-512.png',
  maskable512: '/icons/maskable-512.png',
  appleTouch: '/icons/apple-touch-icon.png',
} as const;

/** Valor que usan los <Select> para representar «sin asignar». */
export const NO_SELECTION = 'none';

/**
 * Grupos de SortableJS que se pueden arrastrar por la aplicación.
 *
 * Vive aquí, y no en una feature, porque lo necesitan tanto quien arrastra
 * (las rejillas de recursos) como quien recibe (las carpetas), y hacer que una
 * feature dependa de la otra sólo por esta lista crearía un ciclo.
 */
export const DRAGGABLE_GROUPS = ['prompts', 'links'] as const;
