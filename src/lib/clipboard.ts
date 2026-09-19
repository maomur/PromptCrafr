/**
 * Copia texto al portapapeles.
 *
 * `navigator.clipboard` sólo existe en contextos seguros (HTTPS o localhost) y
 * puede fallar si el documento no tiene el foco, así que recurrimos al método
 * clásico con un <textarea> oculto antes de darnos por vencidos.
 *
 * @returns `true` si el texto se copió correctamente.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continuamos con el método alternativo.
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
