import { project, unwrapWorldPoints } from './geo';
import type { GeoPoint } from './types';
import { yearWrappedStats } from './highlights';

export function drawJourneyReport(
  canvas: HTMLCanvasElement,
  points: GeoPoint[],
  title: string,
  period: string,
  locale: string,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || points.length === 0) return;
  const stats = yearWrappedStats(points);
  const width = canvas.width;
  const height = canvas.height;
  const world = unwrapWorldPoints(points.map((point) => project(point.latitude, point.longitude)));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of world) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  const pad = 0.1;
  const spanX = Math.max(1e-9, maxX - minX);
  const spanY = Math.max(1e-9, maxY - minY);
  minX -= spanX * pad;
  maxX += spanX * pad;
  minY -= spanY * pad;
  maxY += spanY * pad;

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#1c2a24');
  bg.addColorStop(1, '#f3eee7');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#f6f3ee';
  ctx.font = `700 ${Math.round(width * 0.055)}px sans-serif`;
  ctx.fillText(title.slice(0, 28), width * 0.07, height * 0.1);
  ctx.font = `${Math.round(width * 0.028)}px sans-serif`;
  ctx.fillStyle = 'rgba(246,243,238,0.85)';
  ctx.fillText(period, width * 0.07, height * 0.14);

  const mapTop = height * 0.2;
  const mapH = height * 0.42;
  ctx.strokeStyle = '#c45c26';
  ctx.lineWidth = Math.max(3, width / 220);
  ctx.beginPath();
  world.forEach((point, index) => {
    const x = ((point.x - minX) / (maxX - minX)) * width * 0.86 + width * 0.07;
    const y = mapTop + ((point.y - minY) / (maxY - minY)) * mapH;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const lines = locale === 'en'
    ? [`${stats.km} km`, `${stats.days} days`, `Peak day ${stats.farthestDate}`, `${stats.citiesApprox}+ places`]
    : [`${stats.km} 公里`, `${stats.days} 天`, `最遠一天 ${stats.farthestDate}`, `約 ${stats.citiesApprox} 處據點`];
  ctx.fillStyle = '#1c2a24';
  ctx.font = `650 ${Math.round(width * 0.036)}px sans-serif`;
  lines.forEach((line, index) => {
    ctx.fillText(line, width * 0.07, height * 0.72 + index * height * 0.05);
  });
}
