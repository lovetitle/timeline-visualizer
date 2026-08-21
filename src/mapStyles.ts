import type { Locale } from './i18n';

export type MapStyleId = 'light' | 'dark' | 'voyager' | 'satellite' | 'terrain' | 'night';

export const MAP_STYLES: Record<MapStyleId, { labelZh: string; labelEn: string }> = {
  light: { labelZh: '亮色', labelEn: 'Light' },
  dark: { labelZh: '暗色', labelEn: 'Dark' },
  voyager: { labelZh: '簡約', labelEn: 'Voyager' },
  satellite: { labelZh: '衛星', labelEn: 'Satellite' },
  terrain: { labelZh: '地形', labelEn: 'Terrain' },
  night: { labelZh: '夜景', labelEn: 'Night' },
};

/**
 * Locale-aware raster tiles. Vector MapLibre (name:zh/ja) is approximated by
 * choosing OSM community tiles that favor local-script labels.
 */
export function tileUrlTemplate(style: MapStyleId, locale: Locale): string {
  if (style === 'satellite') {
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  }
  if (style === 'terrain') {
    return 'https://tile.opentopomap.org/{z}/{x}/{y}.png';
  }
  if (style === 'night' || style === 'dark') {
    return 'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png';
  }

  if (locale === 'ja') {
    return 'https://tile.openstreetmap.jp/{z}/{x}/{y}.png';
  }
  if (locale === 'zh' || locale === 'ko') {
    return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
  if (style === 'voyager') {
    return 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
  }
  return 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
}

export function tileCachePrefix(style: MapStyleId, locale: Locale): string {
  return `${style}:${locale}`;
}

export type MarkerStyleId = 'dot' | 'plane' | 'foot';

export const MARKER_STYLES: { id: MarkerStyleId; labelZh: string; labelEn: string }[] = [
  { id: 'dot', labelZh: '圓點', labelEn: 'Dot' },
  { id: 'plane', labelZh: '飛機', labelEn: 'Plane' },
  { id: 'foot', labelZh: '腳印', labelEn: 'Footprint' },
];
