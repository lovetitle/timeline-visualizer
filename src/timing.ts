export type CompressionMode = 'off' | 'gentle' | 'balanced' | 'strong';

const COMPRESSION_EXPONENTS: Record<CompressionMode, number> = {
  off: 1,
  gentle: 0.92,
  balanced: 0.85,
  strong: 0.75,
};

function endpointSlope(firstWidth: number, secondWidth: number, first: number, second: number): number {
  const slope = ((2 * firstWidth + secondWidth) * first - firstWidth * second) / (firstWidth + secondWidth);
  if (slope <= 0) return 0;
  if (slope > 3 * first) return 3 * first;
  return slope;
}

function monotoneSlopes(x: number[], y: number[]): number[] {
  const segmentCount = x.length - 1;
  const delta = Array.from({ length: segmentCount }, (_, index) => (
    (y[index + 1] - y[index]) / (x[index + 1] - x[index])
  ));
  if (segmentCount === 1) return [delta[0], delta[0]];
  const slopes = new Array<number>(x.length).fill(0);
  slopes[0] = endpointSlope(x[1] - x[0], x[2] - x[1], delta[0], delta[1]);
  for (let index = 1; index < x.length - 1; index += 1) {
    if (delta[index - 1] <= 0 || delta[index] <= 0) {
      slopes[index] = 0;
    } else {
      const beforeWidth = x[index] - x[index - 1];
      const afterWidth = x[index + 1] - x[index];
      const weightBefore = 2 * afterWidth + beforeWidth;
      const weightAfter = afterWidth + 2 * beforeWidth;
      slopes[index] = (weightBefore + weightAfter)
        / (weightBefore / delta[index - 1] + weightAfter / delta[index]);
    }
  }
  slopes[slopes.length - 1] = endpointSlope(
    x[x.length - 1] - x[x.length - 2],
    x[x.length - 2] - x[x.length - 3],
    delta[delta.length - 1],
    delta[delta.length - 2],
  );
  return slopes;
}

export function createDistanceAtProgress(
  cumulativeDistanceKm: number[],
  compression: CompressionMode,
): (progress: number) => number {
  const totalKm = cumulativeDistanceKm.at(-1) ?? 0;
  const exponent = COMPRESSION_EXPONENTS[compression];
  if (compression === 'off' || cumulativeDistanceKm.length < 2 || totalKm <= 0) {
    return (progress) => totalKm * Math.max(0, Math.min(1, progress));
  }

  const distances = [0];
  const effective = [0];
  let effectiveTotal = 0;
  for (let index = 1; index < cumulativeDistanceKm.length; index += 1) {
    const segment = cumulativeDistanceKm[index] - cumulativeDistanceKm[index - 1];
    if (segment <= 0) continue;
    effectiveTotal += segment ** exponent;
    distances.push(cumulativeDistanceKm[index]);
    effective.push(effectiveTotal);
  }
  if (effectiveTotal <= 0 || distances.length < 2) {
    return (progress) => totalKm * Math.max(0, Math.min(1, progress));
  }

  const xValues = effective.map((value) => value / effectiveTotal);
  const slopes = monotoneSlopes(xValues, distances);

  return (progress) => {
    const elapsed = Math.max(0, Math.min(1, progress));
    let to = 1;
    while (to < xValues.length && xValues[to] < elapsed) to += 1;
    to = Math.min(Math.max(to, 1), xValues.length - 1);
    const from = to - 1;
    const width = xValues[to] - xValues[from];
    const t = width <= 0 ? 0 : (elapsed - xValues[from]) / width;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * distances[from]
      + (t3 - 2 * t2 + t) * width * slopes[from]
      + (-2 * t3 + 3 * t2) * distances[to]
      + (t3 - t2) * width * slopes[to];
  };
}
