import { project, unwrapWorldPoints } from './geo';
import type { GeoPoint } from './types';

export function drawHeatmapPoster(
  canvas: HTMLCanvasElement,
  points: GeoPoint[],
  title: string,
  subtitle: string,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || points.length === 0) return;
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
  const pad = 0.08;
  const spanX = Math.max(1e-9, maxX - minX);
  const spanY = Math.max(1e-9, maxY - minY);
  minX -= spanX * pad;
  maxX += spanX * pad;
  minY -= spanY * pad;
  maxY += spanY * pad;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1c2a24');
  gradient.addColorStop(1, '#314039');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const toCanvas = (x: number, y: number): [number, number] => [
    ((x - minX) / (maxX - minX)) * width,
    ((y - minY) / (maxY - minY)) * height,
  ];

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let index = 1; index < world.length; index += 1) {
    const [x0, y0] = toCanvas(world[index - 1].x, world[index - 1].y);
    const [x1, y1] = toCanvas(world[index].x, world[index].y);
    ctx.strokeStyle = 'rgba(196, 92, 38, 0.18)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  for (const point of world) {
    const [x, y] = toCanvas(point.x, point.y);
    const radial = ctx.createRadialGradient(x, y, 0, x, y, 18);
    radial.addColorStop(0, 'rgba(196, 92, 38, 0.55)');
    radial.addColorStop(1, 'rgba(196, 92, 38, 0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 252, 247, 0.92)';
  ctx.fillRect(20, height - 110, width - 40, 90);
  ctx.fillStyle = '#1c2a24';
  ctx.font = '700 28px "Segoe UI", sans-serif';
  ctx.fillText(title.slice(0, 28), 36, height - 70, width - 72);
  ctx.fillStyle = '#5d6b64';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillText(subtitle.slice(0, 48), 36, height - 42, width - 72);
}
