import type { Locale } from './i18n';
import { JOURNEY_TEMPLATES } from './templates';
import { THEMES } from './themes';
import { VIDEO_FORMATS } from './formats';

const SELECT_LABELS: Record<Locale, Record<string, Record<string, string>>> = {
  zh: {
    camera: { fixed: '固定縮放', steady: '穩定跟隨', dynamic: '動態跟隨' },
    compression: {
      off: '關 · 1.00',
      gentle: '溫柔 · 0.92',
      balanced: '均衡 · 0.85',
      strong: '強 · 0.75',
    },
    outlier: { conservative: '保守', off: '關' },
    mapStyle: { light: '淺色', dark: '深色', voyager: 'Voyager', satellite: '衛星', terrain: '地形', night: '夜景' },
    marker: { dot: '圓點', plane: '飛機', foot: '步行' },
    chapter: { off: '關閉', day: '依日', city: '依城市' },
    colorGrade: { off: '關閉', auto: '自動', warm: '暖色', cool: '冷色', night: '夜景' },
    template: {
      '': '（手動設定）',
      island: '環島日記',
      business: '出差紀實',
      honeymoon: '蜜月旅程',
      city: '城市漫步',
    },
  },
  en: {
    camera: { fixed: 'Fixed zoom', steady: 'Steady follow', dynamic: 'Dynamic follow' },
    compression: {
      off: 'Off · 1.00',
      gentle: 'Gentle · 0.92',
      balanced: 'Balanced · 0.85',
      strong: 'Strong · 0.75',
    },
    outlier: { conservative: 'Conservative', off: 'Off' },
    mapStyle: { light: 'Light', dark: 'Dark', voyager: 'Voyager', satellite: 'Satellite', terrain: 'Terrain', night: 'Night' },
    marker: { dot: 'Dot', plane: 'Plane', foot: 'Walk' },
    chapter: { off: 'Off', day: 'By day', city: 'By city' },
    colorGrade: { off: 'Off', auto: 'Auto', warm: 'Warm', cool: 'Cool', night: 'Night' },
    template: {
      '': '(Manual)',
      island: 'Island Loop',
      business: 'Business Trip',
      honeymoon: 'Honeymoon',
      city: 'City Walk',
    },
  },
  ja: {
    camera: { fixed: '固定ズーム', steady: '安定追従', dynamic: 'ダイナミック' },
    compression: {
      off: 'オフ · 1.00',
      gentle: 'やさしめ · 0.92',
      balanced: 'バランス · 0.85',
      strong: '強め · 0.75',
    },
    outlier: { conservative: '控えめ', off: 'オフ' },
    mapStyle: { light: 'ライト', dark: 'ダーク', voyager: 'Voyager', satellite: '衛星', terrain: '地形', night: '夜景' },
    marker: { dot: '点', plane: '飛行機', foot: '徒歩' },
    chapter: { off: 'オフ', day: '日ごと', city: '都市ごと' },
    colorGrade: { off: 'オフ', auto: '自動', warm: '暖色', cool: '寒色', night: '夜' },
    template: {
      '': '（手動）',
      island: '島めぐり',
      business: '出張記録',
      honeymoon: 'ハネムーン',
      city: '街歩き',
    },
  },
  ko: {
    camera: { fixed: '고정 줌', steady: '안정 추적', dynamic: '다이내믹' },
    compression: {
      off: '끔 · 1.00',
      gentle: '부드럽게 · 0.92',
      balanced: '균형 · 0.85',
      strong: '강하게 · 0.75',
    },
    outlier: { conservative: '보수적', off: '끔' },
    mapStyle: { light: '밝게', dark: '어둡게', voyager: 'Voyager', satellite: '위성', terrain: '지형', night: '야경' },
    marker: { dot: '점', plane: '비행기', foot: '걷기' },
    chapter: { off: '끔', day: '일별', city: '도시별' },
    colorGrade: { off: '끔', auto: '자동', warm: '따뜻한', cool: '차가운', night: '야간' },
    template: {
      '': '(수동)',
      island: '섬 일주',
      business: '출장 기록',
      honeymoon: '신혼여행',
      city: '도시 산책',
    },
  },
};

function relabelSelect(id: string, labels: Record<string, string>): void {
  const select = document.getElementById(id) as HTMLSelectElement | null;
  if (!select) return;
  const current = select.value;
  for (const option of Array.from(select.options)) {
    const next = labels[option.value];
    if (next) option.textContent = next;
  }
  select.value = current;
}

export function applySelectLocale(locale: Locale): void {
  const pack = SELECT_LABELS[locale];
  relabelSelect('camera-movement', pack.camera);
  relabelSelect('compression-select', pack.compression);
  relabelSelect('outlier-select', pack.outlier);
  relabelSelect('map-style-select', pack.mapStyle);
  relabelSelect('marker-style-select', pack.marker);
  relabelSelect('chapter-select', pack.chapter);
  relabelSelect('template-select', pack.template);
  relabelSelect('color-grade-select', pack.colorGrade);

  const durationSelect = document.getElementById('duration') as HTMLSelectElement | null;
  if (durationSelect) {
    for (const option of Array.from(durationSelect.options)) {
      const seconds = option.value;
      option.textContent = locale === 'en'
        ? `${seconds}s`
        : locale === 'ja'
          ? `${seconds} 秒`
          : locale === 'ko'
            ? `${seconds}초`
            : `${seconds} 秒`;
    }
  }

  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement | null;
  if (themeSelect) {
    const current = themeSelect.value;
    themeSelect.replaceChildren(...THEMES.map((theme) => {
      const label = locale === 'en'
        ? theme.labelEn
        : locale === 'ja'
          ? ({ ember: '暖色', ocean: 'オーシャン', ink: 'インク', sakura: 'さくら' }[theme.id] ?? theme.labelZh)
          : locale === 'ko'
            ? ({ ember: '따뜻한 주황', ocean: '오션', ink: '잉크', sakura: '벚꽃' }[theme.id] ?? theme.labelZh)
            : theme.labelZh;
      return new Option(label, theme.id);
    }));
    themeSelect.value = current || THEMES[0].id;
  }

  const formatSelect = document.getElementById('format-select') as HTMLSelectElement | null;
  if (formatSelect) {
    const current = formatSelect.value;
    formatSelect.replaceChildren(...VIDEO_FORMATS.map((format) => {
      const label = locale === 'en'
        ? format.labelEn
        : locale === 'ja'
          ? format.labelZh.replace('正方形', '正方形').replace('直式', '縦').replace('橫式', '横')
          : locale === 'ko'
            ? format.labelZh.replace('正方形', '정사각').replace('直式', '세로').replace('橫式', '가로')
            : format.labelZh;
      return new Option(label, format.id);
    }));
    formatSelect.value = current || VIDEO_FORMATS[0].id;
  }

  // Keep template titles synced for advanced wiring.
  void JOURNEY_TEMPLATES;
}
