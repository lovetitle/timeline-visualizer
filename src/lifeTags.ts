const KEY = 'tv-life-tags-v1';

export interface LifeTag {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

export function loadLifeTags(): LifeTag[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as LifeTag[];
  } catch {
    return [];
  }
}

export function saveLifeTags(tags: LifeTag[]): void {
  localStorage.setItem(KEY, JSON.stringify(tags.slice(0, 40)));
}

export function addLifeTag(label: string, startDate: string, endDate: string): LifeTag[] {
  const tags = loadLifeTags();
  tags.unshift({
    id: `t${Date.now().toString(36)}`,
    label: label.trim().slice(0, 24) || '章節',
    startDate,
    endDate,
  });
  saveLifeTags(tags);
  return tags;
}
