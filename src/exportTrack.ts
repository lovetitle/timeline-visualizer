import type { GeoPoint } from './types';

export function pointsToGpx(points: GeoPoint[], name = 'Timeline Journey'): string {
  const rows = points.map((point) => (
    `<trkpt lat="${point.latitude}" lon="${point.longitude}"><time>${point.instant.toISOString()}</time></trkpt>`
  )).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Timeline Visualizer">
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${rows}
    </trkseg>
  </trk>
</gpx>`;
}

export function pointsToGeoJson(points: GeoPoint[], name = 'Timeline Journey'): string {
  return JSON.stringify({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name },
        geometry: {
          type: 'LineString',
          coordinates: points.map((point) => [point.longitude, point.latitude]),
        },
      },
      ...points.map((point) => ({
        type: 'Feature',
        properties: { time: point.instant.toISOString() },
        geometry: {
          type: 'Point',
          coordinates: [point.longitude, point.latitude],
        },
      })),
    ],
  }, null, 2);
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
