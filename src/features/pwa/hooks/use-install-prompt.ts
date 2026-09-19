'use client';

import { useEffect, useState } from 'react';

/**
 * `beforeinstallprompt` es una extensión de Chromium que todavía no está en
 * ninguna especificación, así que no existe en las librerías de TypeScript.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const SNOOZE_KEY = 'pwa_install_snooze_until';
const SNOOZE_DAYS = 7;

/**
 * Margen antes de proponer la instalación.
 *
 * El navegador ofrece instalar casi al instante de cargar. Aparecer entonces
 * es interrumpir a alguien que todavía no ha visto la aplicación, así que se
 * espera a que haya tenido tiempo de mirarla.
 */
const DELAY_MS = 12_000;

/** ¿La aplicación ya está instalada y abierta como tal? */
function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari en iOS usa una propiedad propia en lugar de `display-mode`.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function isSnoozed(): boolean {
  try {
    const until = localStorage.getItem(SNOOZE_KEY);
    return !!until && Date.now() < Number.parseInt(until, 10);
  } catch {
    // Navegación privada o almacenamiento bloqueado: preguntamos igual.
    return false;
  }
}

/**
 * Decide si hay que ofrecer la instalación, y cómo.
 *
 * Separa el trato con el navegador —un evento sin estandarizar, la detección
 * de iOS y el recordatorio pospuesto— de la interfaz que lo muestra, que así
 * sólo se ocupa de pintar.
 */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setVisible] = useState(false);
  const [isIOS, setIOS] = useState(false);

  useEffect(() => {
    if (isInstalled() || isSnoozed()) return;

    const appleDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIOS(appleDevice);

    let timer: ReturnType<typeof setTimeout> | undefined;

    const handlePrompt = (browserEvent: Event) => {
      browserEvent.preventDefault();
      setEvent(browserEvent as BeforeInstallPromptEvent);
      timer = setTimeout(() => setVisible(true), DELAY_MS);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);

    // Safari no dispara el evento, así que en iOS se enseñan las
    // instrucciones manuales pasado el mismo margen.
    if (appleDevice) timer = setTimeout(() => setVisible(true), DELAY_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  /** Oculta el aviso y no vuelve a preguntar en una semana. */
  const snooze = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
    } catch {
      // Sin almacenamiento sólo perdemos la memoria del «más tarde».
    }
    setVisible(false);
  };

  const install = async () => {
    if (!event) return;

    await event.prompt();
    const { outcome } = await event.userChoice;

    if (outcome === 'accepted') {
      setEvent(null);
      setVisible(false);
    } else {
      snooze();
    }
  };

  return { isVisible, isIOS, canInstall: !!event, install, snooze };
}
