import type { Locale } from './i18n';

export type MapStyleId = 'light' | 'dark' | 'voyager';

/** Base style ids; actual URL depends on UI locale for labeled tiles. */
export const MAP_STYLES: Record<MapStyleId, { labelZh: string; labelEn: string }> = {
  light: { labelZh: '亮色', labelEn: 'Light' },
  dark: { labelZh: '暗色', labelEn: 'Dark' },
  voyager: { labelZh: '簡約', labelEn: 'Voyager' },
};

/**
 * Raster tiles with language-appropriate labels where free sources allow.
 * CARTO labeled rasters are English-centric; for CJK we prefer OSM community tiles.
 * Dark style uses CARTO nolabels (no English text) so our in-app captions dominate.
 */
export function tileUrlTemplate(style: MapStyleId, locale: Locale): string {
  if (style === 'dark') {
    // Avoid English dark labels; rely on route + place/chapter captions.
    return 'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png';
  }

  if (locale === 'ja') {
    // Japanese community tiles (Japanese labels in Japan; elsewhere may fall back).
    if (style === 'voyager') {
      return 'https://tile.openstreetmap.jp/{z}/{x}/{y}.png';
    }
    return 'https://tile.openstreetmap.jp/{z}/{x}/{y}.png';
  }

  if (locale === 'zh') {
    // Standard OSM shows local-script names in Taiwan/China more often than CARTO English.
    return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  }

  if (locale === 'ko') {
    return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  }

  // English UI: keep CARTO English-labeled styles.
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
