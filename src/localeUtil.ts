import type { Locale } from './i18n';

/** Pick one of four locale strings. */
export function L(
  locale: Locale,
  zh: string,
  en: string,
  ja: string,
  ko: string,
): string {
  if (locale === 'en') return en;
  if (locale === 'ja') return ja;
  if (locale === 'ko') return ko;
  return zh;
}

/** Prefer full locale for place/chapter labels (not collapsed to zh/en). */
export function uiLocale(locale: Locale): Locale {
  return locale;
}

export function intlLocale(locale: Locale): string {
  switch (locale) {
    case 'en':
      return 'en';
    case 'ja':
      return 'ja-JP';
    case 'ko':
      return 'ko-KR';
    default:
      return 'zh-Hant-TW';
  }
}
