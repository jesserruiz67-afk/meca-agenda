export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

type ShareNavigator = Navigator & {
  canShare?: (data: { files?: File[] }) => boolean;
  share?: (data: {
    files?: File[];
    title?: string;
    text?: string;
  }) => Promise<void>;
};

export function sanitizeFileName(value: string): string {
  const clean = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return clean || 'meca-agenda';
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareOrDownload(
  blob: Blob,
  filename: string,
  title: string,
  text: string,
): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as ShareNavigator;
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title, text });
      return 'shared';
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'cancelled';
    }
  }
  downloadBlob(blob, filename);
  return 'downloaded';
}
