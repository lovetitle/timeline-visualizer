const BRAND_KEY = 'tv-brand-v1';

export interface BrandSettings {
  siteName: string;
  tagline: string;
  customDomainNote: string;
}

export function loadBrand(): BrandSettings {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (!raw) return { siteName: 'Timeline Visualizer', tagline: '', customDomainNote: '' };
    return { siteName: 'Timeline Visualizer', tagline: '', customDomainNote: '', ...JSON.parse(raw) };
  } catch {
    return { siteName: 'Timeline Visualizer', tagline: '', customDomainNote: '' };
  }
}

export function saveBrand(settings: BrandSettings): void {
  localStorage.setItem(BRAND_KEY, JSON.stringify(settings));
}

export function applyBrandToDom(settings: BrandSettings): void {
  const mark = document.querySelector('.brand-mark');
  if (mark && settings.siteName.trim()) mark.textContent = settings.siteName.trim();
  const title = document.querySelector('h1[data-i18n="brandTitle"]');
  if (title && settings.tagline.trim()) {
    title.textContent = settings.tagline.trim();
  }
}
