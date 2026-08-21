import { getCachedTile, setCachedTile } from './tileCache';

export interface TilePackEntry {
  key: string;
  mime: string;
  dataUrl: string;
}

export async function exportTilePack(limit = 400): Promise<Blob> {
  // Best-effort: read known keys is not available; instead accept caller-provided keys.
  void limit;
  return new Blob([JSON.stringify({ version: 1, tiles: [] as TilePackEntry[] })], {
    type: 'application/json',
  });
}

export async function importTilePack(text: string): Promise<number> {
  const parsed = JSON.parse(text) as { version?: number; tiles?: TilePackEntry[] };
  if (!parsed.tiles?.length) return 0;
  let count = 0;
  for (const entry of parsed.tiles.slice(0, 800)) {
    if (!entry.key || !entry.dataUrl) continue;
    const response = await fetch(entry.dataUrl);
    const blob = await response.blob();
    await setCachedTile(entry.key, blob);
    count += 1;
  }
  return count;
}

/** Prefetch and store tiles already loaded in a Map into IndexedDB (already done by renderer). */
export async function ensureTilesCached(
  keys: string[],
  blobs: Map<string, Blob>,
): Promise<number> {
  let written = 0;
  for (const key of keys) {
    const existing = await getCachedTile(key);
    if (existing) continue;
    const blob = blobs.get(key);
    if (!blob) continue;
    await setCachedTile(key, blob);
    written += 1;
  }
  return written;
}

export async function packTilesFromKeys(keys: string[]): Promise<Blob> {
  const tiles: TilePackEntry[] = [];
  for (const key of keys.slice(0, 500)) {
    const blob = await getCachedTile(key);
    if (!blob) continue;
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
    tiles.push({
      key,
      mime: blob.type || 'image/png',
      dataUrl: `data:${blob.type || 'image/png'};base64,${btoa(binary)}`,
    });
  }
  return new Blob([JSON.stringify({ version: 1, tiles })], { type: 'application/json' });
}
