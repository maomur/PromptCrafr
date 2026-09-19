import { cn } from '@/lib/utils';

interface LogoProps {
  /** Lado del cuadrado en píxeles. */
  size?: number;
  className?: string;
}

/** Id del degradado. Dos logotipos en la misma página comparten definición,
 *  que es idéntica, así que repetirlo no cambia nada de lo que se pinta. */
const GRADIENT_ID = 'promptcraft-logo-gradient';

/**
 * Marca de PromptCraft: el signo `>_` de un prompt de línea de comandos, con
 * un destello que lo sitúa en el terreno de la IA.
 *
 * Va en línea, y no como <img>, para que escale sin pérdida a cualquier
 * tamaño, no cueste una petición de red y herede el redondeo del contenedor.
 * El fichero equivalente en `public/icons/logo.svg` es el original del que
 * salen los PNG del manifest. No usa hooks, así que puede renderizarse en
 * servidor.
 */
export default function Logo({ size = 40, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn('shrink-0', className)}
      role="img"
      aria-label="PromptCraft"
    >
      <defs>
        <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3D9DFF" />
          <stop offset="1" stopColor="#0062DD" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="15" fill={`url(#${GRADIENT_ID})`} />

      <g
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 23 L29 33 L19 43" />
        <path d="M35 43 H45" />
      </g>

      <path
        d="M46 14 L47.7 19.3 L53 21 L47.7 22.7 L46 28 L44.3 22.7 L39 21 L44.3 19.3 Z"
        fill="#fff"
      />
    </svg>
  );
}
