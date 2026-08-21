export type MapStyleId = 'light' | 'dark' | 'voyager';

export const MAP_STYLES: Record<MapStyleId, { labelZh: string; labelEn: string; url: string }> = {
  light: {
    labelZh: '亮色',
    labelEn: 'Light',
    url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  },
  dark: {
    labelZh: '暗色',
    labelEn: 'Dark',
    url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  },
  voyager: {
    labelZh: '簡約',
    labelEn: 'Voyager',
    url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  },
};

export type MarkerStyleId = 'dot' | 'plane' | 'foot';

export const MARKER_STYLES: { id: MarkerStyleId; labelZh: string; labelEn: string }[] = [
  { id: 'dot', labelZh: '圓點', labelEn: 'Dot' },
  { id: 'plane', labelZh: '飛機', labelEn: 'Plane' },
  { id: 'foot', labelZh: '腳印', labelEn: 'Footprint' },
];
