import { project, unwrapWorldPoints } from './geo';
import type { GeoPoint } from './types';

/** Tall 9:16 story poster (not heatmap). */
export function drawStoryPoster(
  canvas: HTMLCanvasElement,
  points: GeoPoint[],
  title: string,
  subtitle: string,
  statsLine: string,
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
  const pad = 0.12;
  const spanX = Math.max(1e-9, maxX - minX);
  const spanY = Math.max(1e-9, maxY - minY);
  minX -= spanX * pad;
  maxX += spanX * pad;
  minY -= spanY * pad;
  maxY += spanY * pad;

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#1c2a24');
  bg.addColorStop(0.55, '#2a3d34');
  bg.addColorStop(1, '#f6f3ee');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const mapTop = height * 0.18;
  const mapBottom = height * 0.72;
  const mapHeight = mapBottom - mapTop;
  const toCanvas = (x: number, y: number): [number, number] => [
    ((x - minX) / (maxX - minX)) * (width * 0.86) + width * 0.07,
    mapTop + ((y - minY) / (maxY - minY)) * mapHeight,
  ];

  ctx.strokeStyle = 'rgba(196, 92, 38, 0.9)';
  ctx.lineWidth = Math.max(4, width / 180);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  world.forEach((point, index) => {
    const [x, y] = toCanvas(point.x, point.y);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const start = toCanvas(world[0].x, world[0].y);
  const end = toCanvas(world.at(-1)!.x, world.at(-1)!.y);
  ctx.fillStyle = '#c45c26';
  ctx.beginPath();
  ctx.arc(start[0], start[1], 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c2a24';
  ctx.beginPath();
  ctx.arc(end[0], end[1], 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f6f3ee';
  ctx.font = `700 ${Math.round(width * 0.07)}px "Segoe UI", sans-serif`;
  ctx.fillText(title.slice(0, 22), width * 0.08, height * 0.1, width * 0.84);
  ctx.font = `${Math.round(width * 0.035)}px "Segoe UI", sans-serif`;
  ctx.fillStyle = 'rgba(246,243,238,0.85)';
  ctx.fillText(subtitle.slice(0, 40), width * 0.08, height * 0.145, width * 0.84);

  ctx.fillStyle = '#1c2a24';
  ctx.font = `650 ${Math.round(width * 0.04)}px "Segoe UI", sans-serif`;
  ctx.fillText(statsLine.slice(0, 48), width * 0.08, height * 0.82, width * 0.84);
  ctx.font = `${Math.round(width * 0.03)}px "Segoe UI", sans-serif`;
  ctx.fillStyle = '#5d6b64';
  ctx.fillText('Timeline Visualizer', width * 0.08, height * 0.88, width * 0.84);
}
