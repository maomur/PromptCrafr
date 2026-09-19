'use client';

import { useRef, useState } from 'react';
import { Database, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { LibraryState } from '@/features/library/types';
import {
  backupFileName,
  createBackup,
  downloadJson,
  ImportError,
  readBackupFile,
} from '@/features/backup/services/backup';

interface BackupMenuProps {
  state: LibraryState;
  onImport: (next: LibraryState) => Promise<void>;
}

/**
 * Copia de seguridad de la biblioteca.
 *
 * Sin servidor, este fichero es la única forma de llevarse los datos a otro
 * navegador o de recuperarlos si se borra el almacenamiento del sitio, así que
 * el menú está a la vista en la cabecera y no escondido en unos ajustes.
 */
export default function BackupMenu({ state, onImport }: BackupMenuProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<LibraryState | null>(null);

  const total =
    state.projects.length + state.folders.length + state.prompts.length + state.links.length;

  const handleExport = () => {
    downloadJson(backupFileName(), createBackup(state));
    toast({
      title: 'Copia descargada',
      description: `${total} ${total === 1 ? 'elemento' : 'elementos'} en un archivo JSON.`,
    });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    try {
      // Sólo se lee y se valida; nada se escribe hasta que se confirme.
      setPending(await readBackupFile(file));
    } catch (cause) {
      toast({
        variant: 'destructive',
        title: 'No se ha podido leer el archivo',
        description:
          cause instanceof ImportError ? cause.message : 'El archivo no tiene el formato esperado.',
      });
    }
  };

  const confirmImport = async () => {
    if (!pending) return;

    const imported =
      pending.projects.length + pending.folders.length + pending.prompts.length + pending.links.length;

    await onImport(pending);
    setPending(null);
    toast({ title: 'Biblioteca importada', description: `${imported} elementos restaurados.` });
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Database className="h-4 w-4" />
            <span className="sr-only">Copia de seguridad</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Copia de seguridad</DropdownMenuLabel>
          <DropdownMenuItem onSelect={handleExport} disabled={total === 0}>
            <Download className="mr-2 h-4 w-4" />
            Descargar copia (JSON)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importar desde un archivo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          // Permite volver a elegir el mismo archivo si algo salió mal.
          event.target.value = '';
        }}
      />

      {/* Importar reemplaza: conviene decirlo antes, no después. */}
      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reemplazar la biblioteca?</AlertDialogTitle>
            <AlertDialogDescription>
              El archivo contiene {pending?.prompts.length ?? 0} prompts,{' '}
              {pending?.links.length ?? 0} enlaces y{' '}
              {(pending?.projects.length ?? 0) + (pending?.folders.length ?? 0)} carpetas. Lo que
              tengas ahora se borrará y quedará sólo el contenido del archivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Reemplazar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
