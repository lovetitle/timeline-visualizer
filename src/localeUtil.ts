import type { Locale } from './i18n';

export function uiLocale(locale: Locale): 'zh' | 'en' {
  return locale === 'en' ? 'en' : 'zh';
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
