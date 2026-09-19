'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface NameDialogRequest {
  title: string;
  description: string;
  /** Texto de partida; vacío al crear, el nombre actual al renombrar. */
  initialValue?: string;
  confirmLabel: string;
  onConfirm: (name: string) => void;
}

interface NameDialogProps {
  /** La petición en curso, o `null` si el diálogo está cerrado. */
  request: NameDialogRequest | null;
  onClose: () => void;
}

/**
 * Diálogo de un solo campo, compartido por crear proyecto, renombrar proyecto,
 * crear carpeta y renombrar carpeta.
 *
 * Quien lo abre describe qué pide y qué hacer con la respuesta, de modo que no
 * hace falta un estado distinto por cada una de esas cuatro acciones.
 */
export default function NameDialog({ request, onClose }: NameDialogProps) {
  const [value, setValue] = useState('');

  // Cada petición nueva reinicia el campo con su valor de partida.
  useEffect(() => {
    if (request) setValue(request.initialValue ?? '');
  }, [request]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    request?.onConfirm(trimmed);
    onClose();
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{request?.title}</DialogTitle>
          <DialogDescription>{request?.description}</DialogDescription>
        </DialogHeader>

        <Input
          value={value}
          autoFocus
          maxLength={60}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          // Al renombrar, el texto llega preseleccionado para poder escribir
          // encima sin tener que borrarlo antes.
          onFocus={(event) => event.target.select()}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!value.trim()}>
            {request?.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
