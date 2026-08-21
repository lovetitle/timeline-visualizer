import type { JourneyStats } from './stats';

const KEY = 'tv-stats-snapshot-v1';

export function saveJourneyStatsSnapshot(stats: JourneyStats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function loadJourneyStatsSnapshot(): JourneyStats | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JourneyStats;
  } catch {
    return null;
  }
}

export function renderStatsPage(stats: JourneyStats | null): void {
  const empty = document.getElementById('stats-empty');
  const panel = document.getElementById('stats-panel');
  const list = document.getElementById('stats-list');
  const heat = document.getElementById('stats-heatmap');
  const cities = document.getElementById('stats-cities');
  if (!stats || stats.pointCount === 0) {
    empty?.classList.remove('hidden');
    panel?.classList.add('hidden');
    return;
  }
  empty?.classList.add('hidden');
  panel?.classList.remove('hidden');
  if (list) {
    list.replaceChildren(
      ...[
        `期間：${stats.startDate} → ${stats.endDate}`,
        `定位點：${stats.pointCount.toLocaleString()}`,
        `總里程：約 ${Math.round(stats.totalKm).toLocaleString()} km`,
        `天數：${stats.dayCount}`,
        `城市數：${stats.cityCount}`,
        stats.farthestDay
          ? `最遠一天：${stats.farthestDay.date}（約 ${Math.round(stats.farthestDay.km)} km）`
          : '最遠一天：—',
      ].map((text) => {
        const item = document.createElement('li');
        item.textContent = text;
        return item;
      }),
    );
  }
  if (cities) cities.textContent = stats.cities.join(' · ') || '—';
  if (heat) {
    const max = Math.max(...stats.dayKm.map((row) => row.km), 1);
    heat.replaceChildren(...stats.dayKm.map((row) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'heat-cell';
      cell.title = `${row.date}: ${Math.round(row.km)} km`;
      cell.style.opacity = String(0.2 + 0.8 * (row.km / max));
      cell.textContent = row.date.slice(5);
      return cell;
    }));
  }
}
