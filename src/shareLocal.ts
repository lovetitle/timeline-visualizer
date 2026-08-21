const DB = 'timeline-visualizer-share';
const STORE = 'previews';
const TTL_MS = 1000 * 60 * 60 * 24; // 24h

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('share db'));
  });
}

export async function saveLocalSharePreview(blob: Blob, meta: { title: string; period: string }): Promise<string> {
  const id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      blob,
      meta,
      createdAt: Date.now(),
      expiresAt: Date.now() + TTL_MS,
    }, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return id;
}

export async function loadLocalSharePreview(id: string): Promise<{ blob: Blob; meta: { title: string; period: string } } | null> {
  const db = await openDb();
  const row = await new Promise<{ blob: Blob; meta: { title: string; period: string }; expiresAt: number } | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result as typeof row);
    request.onerror = () => reject(request.error);
  });
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    await deleteLocalSharePreview(id);
    return null;
  }
  return { blob: row.blob, meta: row.meta };
}

export async function deleteLocalSharePreview(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function sharePreviewUrl(id: string): string {
  const base = new URL('./share.html', window.location.href);
  base.searchParams.set('id', id);
  return base.toString();
}
