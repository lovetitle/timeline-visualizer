import { describe, expect, it } from 'vitest';
import { alignEncodeSize, codecCandidatesForSize } from './video';

describe('alignEncodeSize', () => {
  it('keeps even sizes', () => {
    expect(alignEncodeSize(1080)).toBe(1080);
    expect(alignEncodeSize(1920)).toBe(1920);
  });

  it('rounds odd sizes up to even', () => {
    expect(alignEncodeSize(1081)).toBe(1082);
  });
});

describe('codecCandidatesForSize', () => {
  it('uses level 3.1 class codecs for 720p and below', () => {
    const list = codecCandidatesForSize(720, 720);
    expect(list).toContain('avc1.42001f');
    expect(list.some((item) => item?.endsWith('28'))).toBe(false);
  });

  it('uses level 4.0+ codecs for 1080p', () => {
    const list = codecCandidatesForSize(1080, 1080);
    expect(list).toContain('avc1.4D4028');
    expect(list).toContain('avc1.640028');
    expect(list).not.toContain('avc1.42001f');
  });
});
