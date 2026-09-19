'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Impide que un formulario se envíe más de una vez.
 *
 * Los diálogos se cierran al guardar, pero no instantáneamente: entre el
 * primer clic y el desmontaje hay una ventana de unas décimas en la que el
 * botón sigue ahí. Un doble clic —o dos Enter seguidos— creaba dos recursos
 * idénticos.
 *
 * El cerrojo es una ref y no un estado porque dos clics en el mismo fotograma
 * verían el estado todavía sin actualizar. El estado sólo sirve para poder
 * deshabilitar el botón.
 */
export function useSingleSubmit<T>(onSubmit: (values: T) => void) {
  const [isSubmitting, setSubmitting] = useState(false);
  const locked = useRef(false);

  const submit = useCallback(
    (values: T) => {
      if (locked.current) return;
      locked.current = true;
      setSubmitting(true);
      onSubmit(values);
    },
    [onSubmit]
  );

  return { submit, isSubmitting };
}
