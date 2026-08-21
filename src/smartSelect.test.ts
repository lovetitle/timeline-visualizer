import { describe, expect, it } from 'vitest';
import { suggestDurationSeconds, trimIdleEdges } from './smartSelect';
import { classifyError } from './errors';
import { filterLocationOutliers } from './outlier';
import type { GeoPoint } from './types';

function point(lat: number, lon: number, day: string): GeoPoint {
  return { instant: new Date(`${day}T12:00:00Z`), latitude: lat, longitude: lon, recordedDate: day };
}

describe('suggestDurationSeconds', () => {
  it('scales with distance', () => {
    expect(suggestDurationSeconds(10)).toBe(15);
    expect(suggestDurationSeconds(200)).toBe(45);
    expect(suggestDurationSeconds(5000)).toBe(120);
  });
});

describe('trimIdleEdges', () => {
  it('removes idle edge days', () => {
    const points = [
      point(25.03, 121.56, '2024-01-01'),
      point(25.031, 121.561, '2024-01-01'),
      point(24.15, 120.67, '2024-01-02'),
      point(22.63, 120.30, '2024-01-02'),
      point(22.631, 120.301, '2024-01-03'),
      point(22.632, 120.302, '2024-01-03'),
    ];
    const trimmed = trimIdleEdges(points, 50);
    expect(trimmed.length).toBeGreaterThan(0);
  });
});

describe('classifyError', () => {
  it('detects encoder issues', () => {
    expect(classifyError(new Error('WebCodecs missing')).code).toBe('encoder-unsupported');
  });
});

describe('filterLocationOutliers', () => {
  it('keeps short plausible routes', () => {
    const points = [
      point(25.03, 121.56, '2024-01-01'),
      point(25.04, 121.57, '2024-01-01'),
      point(25.05, 121.58, '2024-01-01'),
    ];
    expect(filterLocationOutliers(points).removedCount).toBe(0);
  });
});
