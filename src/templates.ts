export interface JourneyTemplate {
  id: string;
  titleZh: string;
  titleEn: string;
  themeId: string;
  camera: 'fixed' | 'steady' | 'dynamic';
  compression: 'off' | 'gentle' | 'balanced' | 'strong';
  formatId: string;
  durationHint: number;
}

export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    id: 'island',
    titleZh: '環島日記',
    titleEn: 'Island Loop',
    themeId: 'ember',
    camera: 'steady',
    compression: 'balanced',
    formatId: 'sq1080',
    durationHint: 60,
  },
  {
    id: 'business',
    titleZh: '出差紀實',
    titleEn: 'Business Trip',
    themeId: 'ink',
    camera: 'fixed',
    compression: 'strong',
    formatId: 'landscape',
    durationHint: 30,
  },
  {
    id: 'honeymoon',
    titleZh: '蜜月旅程',
    titleEn: 'Honeymoon',
    themeId: 'sakura',
    camera: 'dynamic',
    compression: 'gentle',
    formatId: 'portrait',
    durationHint: 90,
  },
  {
    id: 'city',
    titleZh: '城市漫步',
    titleEn: 'City Walk',
    themeId: 'ocean',
    camera: 'dynamic',
    compression: 'off',
    formatId: 'sq720',
    durationHint: 45,
  },
];

export function templateById(id: string): JourneyTemplate | undefined {
  return JOURNEY_TEMPLATES.find((template) => template.id === id);
}
