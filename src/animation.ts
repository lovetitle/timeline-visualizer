import type { TimelineFrame } from './types';

export const OUTRO_SECONDS = 1.5;
export const OUTRO_TRANSITION_SECONDS = 1;

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function totalDurationSeconds(
  journeyDurationSeconds: number,
  outroHoldSeconds = OUTRO_SECONDS,
): number {
  return Math.max(1, journeyDurationSeconds) + Math.max(OUTRO_TRANSITION_SECONDS, outroHoldSeconds);
}

export function frameAtElapsedSeconds(
  elapsedSeconds: number,
  journeyDurationSeconds: number,
  outroHoldSeconds = OUTRO_SECONDS,
): TimelineFrame {
  const journeySeconds = Math.max(1, journeyDurationSeconds);
  if (elapsedSeconds <= journeySeconds) {
    const linear = clamp(elapsedSeconds / journeySeconds);
    // Gentle ease keeps camera from feeling snappy vs bare competitors.
    return { journeyProgress: easeInOutCubic(linear), outroProgress: 0 };
  }
  const transition = Math.max(OUTRO_TRANSITION_SECONDS, Math.min(outroHoldSeconds, OUTRO_TRANSITION_SECONDS + 2));
  return {
    journeyProgress: 1,
    outroProgress: clamp((elapsedSeconds - journeySeconds) / transition),
  };
}

export function frameAtOverallProgress(
  overallProgress: number,
  journeyDurationSeconds: number,
): TimelineFrame {
  return frameAtElapsedSeconds(
    clamp(overallProgress) * totalDurationSeconds(journeyDurationSeconds),
    journeyDurationSeconds,
  );
}

export function easeOutCubic(value: number): number {
  const inverse = 1 - clamp(value);
  return 1 - inverse * inverse * inverse;
}

export function easeInOutCubic(value: number): number {
  const amount = clamp(value);
  if (amount < 0.5) return 4 * amount * amount * amount;
  const inverse = -2 * amount + 2;
  return 1 - inverse * inverse * inverse / 2;
}
