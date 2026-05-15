/**
 * Collect image files from a drag-and-drop DataTransfer, including nested folders
 * (via webkitGetAsEntry / getAsEntry). Falls back to dataTransfer.files when the
 * File System Entry API is unavailable.
 */

type LegacyFsEntry = LegacyFileEntry | LegacyDirectoryEntry;

interface LegacyFileEntry {
  readonly isFile: true;
  readonly isDirectory: false;
  readonly name: string;
  file(success: (file: File) => void, error?: (err: DOMException) => void): void;
}

interface LegacyDirectoryEntry {
  readonly isFile: false;
  readonly isDirectory: true;
  readonly name: string;
  createReader(): LegacyDirectoryReader;
}

interface LegacyDirectoryReader {
  readEntries(success: (entries: LegacyFsEntry[]) => void, error?: (err: DOMException) => void): void;
}

function getEntryFromItem(item: DataTransferItem): LegacyFsEntry | null {
  const extended = item as DataTransferItem & {
    webkitGetAsEntry?: () => LegacyFsEntry | null;
    getAsEntry?: () => LegacyFsEntry | null;
  };
  const fn = extended.webkitGetAsEntry ?? extended.getAsEntry;
  if (typeof fn !== 'function') return null;
  return fn.call(extended) ?? null;
}

function readAllDirectoryEntries(reader: LegacyDirectoryReader): Promise<LegacyFsEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: LegacyFsEntry[] = [];
    const readBatch = (): void => {
      reader.readEntries(
        (batch) => {
          if (batch.length === 0) resolve(entries);
          else {
            entries.push(...batch);
            readBatch();
          }
        },
        (err) => reject(err)
      );
    };
    readBatch();
  });
}

function entryToFile(entry: LegacyFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

async function traverseEntry(
  entry: LegacyFsEntry,
  pathPrefix: string
): Promise<{ file: File; sortKey: string }[]> {
  const sortKey = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;
  if (entry.isFile) {
    const file = await entryToFile(entry);
    if (!file.type.startsWith('image/')) return [];
    return [{ file, sortKey }];
  }
  const reader = entry.createReader();
  const children = await readAllDirectoryEntries(reader);
  const nested = await Promise.all(
    children.map((child) => traverseEntry(child, sortKey))
  );
  return nested.flat();
}

export async function collectImageFilesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  const items = dt.items;
  if (items && items.length > 0) {
    const firstEntry = getEntryFromItem(items[0]);
    if (firstEntry) {
      const collected: { file: File; sortKey: string }[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = getEntryFromItem(items[i]);
        if (entry) {
          collected.push(...(await traverseEntry(entry, '')));
        }
      }
      const dedupByPath = [...new Map(collected.map((c) => [c.sortKey, c])).values()];
      dedupByPath.sort((a, b) =>
        a.sortKey.localeCompare(b.sortKey, undefined, { sensitivity: 'base', numeric: true })
      );
      return dedupByPath.map((c) => c.file);
    }
  }

  return Array.from(dt.files).filter((f) => f.type.startsWith('image/'));
}
