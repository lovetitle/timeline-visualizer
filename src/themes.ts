export interface Theme {
  id: string;
  labelZh: string;
  labelEn: string;
  route: string;
  routeFade: string;
  marker: string;
  markerRing: string;
  titleBg: string;
  title: string;
  subtitle: string;
}

export const THEMES: Theme[] = [
  {
    id: 'ember',
    labelZh: '暖橘',
    labelEn: 'Ember',
    route: '#c45c26',
    routeFade: 'rgba(196, 92, 38, 0.34)',
    marker: '#1c2a24',
    markerRing: '#c45c26',
    titleBg: 'rgba(255, 248, 242, 0.88)',
    title: '#1c2a24',
    subtitle: '#5d6b64',
  },
  {
    id: 'ocean',
    labelZh: '海洋',
    labelEn: 'Ocean',
    route: '#1f6feb',
    routeFade: 'rgba(31, 111, 235, 0.34)',
    marker: '#0b1f33',
    markerRing: '#1f6feb',
    titleBg: 'rgba(240, 247, 255, 0.88)',
    title: '#0b1f33',
    subtitle: '#4b6178',
  },
  {
    id: 'ink',
    labelZh: '墨黑',
    labelEn: 'Ink',
    route: '#111111',
    routeFade: 'rgba(17, 17, 17, 0.28)',
    marker: '#111111',
    markerRing: '#666666',
    titleBg: 'rgba(255, 255, 255, 0.9)',
    title: '#111111',
    subtitle: '#555555',
  },
  {
    id: 'sakura',
    labelZh: '櫻粉',
    labelEn: 'Sakura',
    route: '#e90064',
    routeFade: 'rgba(233, 0, 100, 0.34)',
    marker: '#24191d',
    markerRing: '#e90064',
    titleBg: 'rgba(255, 248, 250, 0.86)',
    title: '#24191d',
    subtitle: '#5c4b52',
  },
];

export function themeById(id: string): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
