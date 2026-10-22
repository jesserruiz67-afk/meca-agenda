import { useRef, useState, type ChangeEvent } from 'react';
import {
  Cloud,
  Download,
  Upload,
  Share2,
  Database,
  Package,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Backup } from '../types';
import {
  readLastBackupAt,
  restoreBackup,
  writeLastBackupAt,
} from '../lib/storage';
import { todayISO } from '../lib/utils';
import StatCard from './StatCard';

type ShareNavigator = Navigator & {
  canShare?: (data: { files?: File[] }) => boolean;
  share?: (data: {
    files?: File[];
    title?: string;
    text?: string;
  }) => Promise<void>;
};

type Props = {
  profileId: string;
  buildBackup: () => Backup;
  onRestored: () => void;
};

export default function BackupView({
  profileId,
  buildBackup,
  onRestored,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastBackup, setLastBackup] = useState(() =>
    readLastBackupAt(profileId),
  );

  const summary = buildBackup();

  function markSaved() {
    const now = new Date().toISOString();
    writeLastBackupAt(profileId, now);
    setLastBackup(now);
    setMessage('Respaldo generado correctamente.');
    setError('');
  }

  function backupFile(): File {
    const json = JSON.stringify(buildBackup(), null, 2);
    return new File(
      [json],
      `meca-agenda-respaldo-${todayISO()}.json`,
      { type: 'application/json' },
    );
  }

  function handleDownload() {
    const file = backupFile();
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    markSaved();
  }

  async function handleShare() {
    const file = backupFile();
    const nav = navigator as ShareNavigator;
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      try {
        await nav.share({
          files: [file],
          title: 'Respaldo MecaAgenda',
          text: 'Respaldo de datos del taller',
        });
        markSaved();
      } catch (shareError) {
        if ((shareError as Error).name !== 'AbortError') {
          setError(
            'No se pudo abrir el menú de compartir. Probá con "Descargar respaldo".',
          );
        }
      }
      return;
    }
    handleDownload();
    setError(
      'Este navegador no permite compartir archivos. Se descargó el respaldo: subilo a Drive manualmente.',
    );
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Backup;
        if (
          !Array.isArray(parsed.maintenances) ||
          !Array.isArray(parsed.products) ||
          !Array.isArray(parsed.transactions)
        ) {
          throw new Error('Formato inválido');
        }
        if (
          !window.confirm(
            'Esto reemplaza los datos actuales de este perfil con los del respaldo. ¿Continuar?',
          )
        ) {
          return;
        }
        restoreBackup(profileId, parsed);
        onRestored();
        setMessage(
          `Respaldo restaurado: ${parsed.maintenances.length} registros, ${parsed.products.length} productos y ${parsed.transactions.length} movimientos.`,
        );
        setError('');
      } catch {
        setError('El archivo no es un respaldo válido de MecaAgenda.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          label="Registros"
          value={summary.maintenances.length}
          icon={Database}
          accent="bg-sky-500/15 text-sky-400"
          compact
        />
        <StatCard
          label="Productos"
          value={summary.products.length}
          icon={Package}
          accent="bg-amber-500/15 text-amber-400"
          compact
        />
        <StatCard
          label="Movimientos"
          value={summary.transactions.length}
          icon={Wallet}
          accent="bg-emerald-500/15 text-emerald-400"
          compact
        />
      </section>

      {(message || error) && (
        <div
          className={`mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ring-1 ${
            error
              ? 'bg-red-500/10 text-red-300 ring-red-500/30'
              : 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
          }`}
        >
          {error ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{error || message}</span>
        </div>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Cloud className="h-4 w-4 text-amber-400" /> Guardar en Drive u otra
            nube
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Genera un archivo con agenda, inventario, caja y numeración de
            facturas. En el celular se abre el menú de compartir para elegir
            Google Drive, Dropbox o la app que uses.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <Share2 className="h-4 w-4" /> Compartir / Guardar en Drive
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
            >
              <Download className="h-4 w-4" /> Descargar respaldo
            </button>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {lastBackup
              ? `Último respaldo: ${new Date(lastBackup).toLocaleString('es-AR')}`
              : 'Todavía no generaste ningún respaldo.'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Upload className="h-4 w-4 text-amber-400" /> Restaurar desde
            archivo
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Elegí el archivo <span className="font-mono">.json</span> que
            guardaste en Drive o en el teléfono. Se reemplazan los datos de
            este dispositivo.
          </p>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Upload className="h-4 w-4" /> Elegir archivo de respaldo
          </button>
          <p className="mt-3 text-[11px] text-slate-500">
            En el celular podés elegir el archivo directamente desde Google
            Drive.
          </p>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400">
        <h2 className="font-semibold text-slate-200">¿Cómo funciona?</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            Los datos se guardan en este navegador (localStorage). Si cambiás de
            dispositivo o borrás los datos del navegador, se pierden.
          </li>
          <li>
            Generá un respaldo periódicamente y guardalo en Drive u otra nube.
          </li>
          <li>
            Para restaurar en el celular, abrí el archivo desde Drive y elegilo
            acá, o descargalo y seleccionalo.
          </li>
          <li>
            La caja también se puede respaldar por separado desde el módulo
            Caja, con sus propios botones para Drive y CSV.
          </li>
        </ul>
      </section>
    </div>
  );
}
