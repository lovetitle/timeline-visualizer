import { describe, expect, it } from 'vitest';
import { classifyActivity, activityWeight } from './activity';
import { downsamplePoints } from './downsample';
import { withRetry } from './retry';
import { chaptersToSrt } from './srt';

describe('downsamplePoints', () => {
  it('keeps small arrays intact', () => {
    const points = Array.from({ length: 10 }, (_, index) => ({
      instant: new Date(index * 1000),
      latitude: 25,
      longitude: 121 + index * 0.01,
    }));
    expect(downsamplePoints(points, 100).removed).toBe(0);
  });

  it('thins large arrays', () => {
    const points = Array.from({ length: 1000 }, (_, index) => ({
      instant: new Date(index * 1000),
      latitude: 25,
      longitude: 121 + index * 0.001,
    }));
    const result = downsamplePoints(points, 100);
    expect(result.points.length).toBeLessThanOrEqual(101);
    expect(result.removed).toBeGreaterThan(0);
  });
});

describe('activity', () => {
  it('classifies transport modes', () => {
    expect(classifyActivity('FLYING')).toBe('fly');
    expect(classifyActivity('IN_PASSENGER_VEHICLE')).toBe('drive');
    expect(classifyActivity('WALKING')).toBe('walk');
    expect(activityWeight('fly')).toBeLessThan(activityWeight('walk'));
  });
});

describe('withRetry', () => {
  it('retries then succeeds', async () => {
    let attempts = 0;
    const value = await withRetry(async () => {
      attempts += 1;
      if (attempts < 2) throw new Error('fail');
      return 'ok';
    }, { retries: 2, delayMs: 1 });
    expect(value).toBe('ok');
    expect(attempts).toBe(2);
  });
});

describe('chaptersToSrt', () => {
  it('formats SRT cues', () => {
    const srt = chaptersToSrt([
      { label: 'Day 1', startProgress: 0, endProgress: 0.5 },
      { label: 'Day 2', startProgress: 0.5, endProgress: 1 },
    ], 10);
    expect(srt).toContain('Day 1');
    expect(srt).toContain('00:00:00,000');
    expect(srt).toContain('00:00:05,000');
  });
});
