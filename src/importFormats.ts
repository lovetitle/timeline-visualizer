import type { GeoPoint } from './types';

function textOf(node: Element | null): string {
  return node?.textContent?.trim() ?? '';
}

function parseGpxTime(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseGpx(text: string): GeoPoint[] {
  const document = new DOMParser().parseFromString(text, 'application/xml');
  if (document.querySelector('parsererror')) {
    throw new Error('GPX 檔無法解析。');
  }
  const nodes = [...document.querySelectorAll('trkpt, rtept, wpt')];
  const points: GeoPoint[] = [];
  nodes.forEach((node, index) => {
    const latitude = Number(node.getAttribute('lat'));
    const longitude = Number(node.getAttribute('lon'));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const time = parseGpxTime(textOf(node.querySelector('time')))
      ?? new Date(Date.UTC(2024, 0, 1, 0, 0, index));
    points.push({ instant: time, latitude, longitude });
  });
  if (points.length === 0) throw new Error('這個 GPX 沒有可用的定位點。');
  return points.sort((a, b) => a.instant.getTime() - b.instant.getTime());
}

export function parseKml(text: string): GeoPoint[] {
  const document = new DOMParser().parseFromString(text, 'application/xml');
  if (document.querySelector('parsererror')) {
    throw new Error('KML 檔無法解析。');
  }
  const points: GeoPoint[] = [];
  const coordBlocks = [...document.querySelectorAll('coordinates')];
  let index = 0;
  for (const block of coordBlocks) {
    const raw = textOf(block);
    for (const token of raw.split(/\s+/)) {
      if (!token.includes(',')) continue;
      const [lonText, latText] = token.split(',');
      const longitude = Number(lonText);
      const latitude = Number(latText);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      points.push({
        instant: new Date(Date.UTC(2024, 0, 1, 0, 0, index)),
        latitude,
        longitude,
      });
      index += 1;
    }
  }
  if (points.length === 0) throw new Error('這個 KML 沒有可用的定位點。');
  return points;
}

export function detectImportKind(file: File): 'json' | 'gpx' | 'kml' | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.json') || file.type === 'application/json') return 'json';
  if (name.endsWith('.gpx') || file.type.includes('gpx')) return 'gpx';
  if (name.endsWith('.kml') || file.type.includes('kml')) return 'kml';
  return null;
}
