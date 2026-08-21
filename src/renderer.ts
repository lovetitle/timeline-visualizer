import { easeInOutCubic, easeOutCubic } from './animation';
import {
  blendViewport,
  buildCameraTrack,
  cameraViewportAt,
  overviewViewport,
  worldPositionAtDistance,
} from './camera';
import { cumulativeDistances, overviewRouteSegments, project, unwrapWorldPoints } from './geo';
import { createDistanceAtProgress, type CompressionMode } from './timing';
import type {
  CameraMovement,
  DrawStyle,
  GeoPoint,
  PreparedJourney,
  TimelineFrame,
  Viewport,
  WorldPoint,
} from './types';

const TILE_TEMPLATE = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

const DEFAULT_STYLE: DrawStyle = {
  route: '#c45c26',
  routeFade: 'rgba(196, 92, 38, 0.34)',
  marker: '#1c2a24',
  markerRing: '#c45c26',
  titleBg: 'rgba(255, 248, 242, 0.88)',
  title: '#1c2a24',
  subtitle: '#5d6b64',
};

function worldToCanvas(
  point: WorldPoint,
  viewport: Viewport,
  width: number,
  height: number,
): [number, number] {
  return [
    ((point.x - viewport.minX) / (viewport.maxX - viewport.minX)) * width,
    ((point.y - viewport.minY) / (viewport.maxY - viewport.minY)) * height,
  ];
}

interface TileCoordinate {
  zoom: number;
  x: number;
  y: number;
}

function tileKey(tile: TileCoordinate): string {
  return `${tile.zoom}/${tile.x}/${tile.y}`;
}

function loadImage(url: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    const cleanup = (): void => signal?.removeEventListener('abort', abort);
    const abort = (): void => {
      image.src = '';
      cleanup();
      reject(new DOMException('已取消產出影片。', 'AbortError'));
    };
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error(`無法載入地圖圖磚 ${url}`));
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener('abort', abort, { once: true });
    image.src = url;
  });
}

export function requiredTiles(viewport: Viewport): TileCoordinate[] {
  const tileCount = 2 ** viewport.zoom;
  const minTileX = Math.floor(viewport.minX * tileCount);
  const maxTileX = Math.floor(viewport.maxX * tileCount);
  const minTileY = Math.max(0, Math.floor(viewport.minY * tileCount));
  const maxTileY = Math.min(tileCount - 1, Math.floor(viewport.maxY * tileCount));
  const tiles: TileCoordinate[] = [];
  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      tiles.push({
        zoom: viewport.zoom,
        x: ((tileX % tileCount) + tileCount) % tileCount,
        y: tileY,
      });
    }
  }
  return tiles;
}

function drawMapBackground(
  canvas: HTMLCanvasElement,
  viewport: Viewport,
  tiles: Map<string, HTMLImageElement>,
): void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('無法使用 Canvas 繪製。');
  context.fillStyle = '#f2edf0';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const tileCount = 2 ** viewport.zoom;
  const minTileX = Math.floor(viewport.minX * tileCount);
  const maxTileX = Math.floor(viewport.maxX * tileCount);
  const minTileY = Math.max(0, Math.floor(viewport.minY * tileCount));
  const maxTileY = Math.min(tileCount - 1, Math.floor(viewport.maxY * tileCount));

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
      const image = tiles.get(tileKey({ zoom: viewport.zoom, x: wrappedX, y: tileY }));
      if (!image) continue;
      const worldX = tileX / tileCount;
      const worldY = tileY / tileCount;
      const [left, top] = worldToCanvas({ x: worldX, y: worldY }, viewport, canvas.width, canvas.height);
      const width = (1 / tileCount / (viewport.maxX - viewport.minX)) * canvas.width;
      const height = (1 / tileCount / (viewport.maxY - viewport.minY)) * canvas.height;
      context.drawImage(image, left, top, width, height);
    }
  }
}

async function loadRequiredTiles(
  coordinates: TileCoordinate[],
  signal?: AbortSignal,
  onProgress?: (completed: number, total: number) => void,
): Promise<Map<string, HTMLImageElement>> {
  const tiles = new Map<string, HTMLImageElement>();
  let nextIndex = 0;
  let completed = 0;
  const worker = async (): Promise<void> => {
    while (nextIndex < coordinates.length) {
      if (signal?.aborted) throw new DOMException('已取消產出影片。', 'AbortError');
      const coordinate = coordinates[nextIndex];
      nextIndex += 1;
      const url = TILE_TEMPLATE.replace('{z}', String(coordinate.zoom))
        .replace('{x}', String(coordinate.x))
        .replace('{y}', String(coordinate.y));
      try {
        tiles.set(tileKey(coordinate), await loadImage(url, signal));
      } catch (error) {
        if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) throw error;
      }
      completed += 1;
      onProgress?.(completed, coordinates.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, coordinates.length) }, worker));
  return tiles;
}

export async function prepareJourney(
  points: GeoPoint[],
  width = 480,
  height = 480,
  cameraMovement: CameraMovement = 'steady',
  durationSeconds = 30,
  compression: CompressionMode = 'balanced',
  signal?: AbortSignal,
  onProgress?: (completed: number, total: number) => void,
): Promise<PreparedJourney> {
  if (points.length < 2) throw new Error('請選擇至少包含兩個定位點的期間。');
  const aspect = width / height;
  const size = Math.max(width, height);
  const worldPoints = unwrapWorldPoints(points.map((point) => project(point.latitude, point.longitude)));
  const distances = cumulativeDistances(points);
  const journey = {
    points,
    worldPoints,
    cumulativeDistanceKm: distances,
    totalDistanceKm: distances.at(-1) ?? 0,
  };
  const distanceAtProgress = createDistanceAtProgress(distances, compression);
  const cameraTrack = buildCameraTrack(journey, size, cameraMovement, aspect);
  const overviewSegments = overviewRouteSegments(worldPoints);
  const endingOverview = overviewViewport(
    { ...journey, worldPoints: overviewSegments.flat() },
    size,
  );
  const sampleCount = Math.max(
    20,
    Math.min(durationSeconds * 8, Math.max(durationSeconds * 2, Math.ceil(journey.totalDistanceKm / 250))),
  );
  const required = new Map<string, TileCoordinate>();
  for (let sample = 0; sample <= sampleCount; sample += 1) {
    for (const tile of requiredTiles(cameraViewportAt(cameraTrack, sample / sampleCount))) {
      required.set(tileKey(tile), tile);
    }
  }
  const journeyEnd = cameraViewportAt(cameraTrack, 1);
  for (let sample = 0; sample <= 12; sample += 1) {
    const ending = blendViewport(journeyEnd, endingOverview, easeOutCubic(sample / 12), size);
    for (const tile of requiredTiles(ending)) required.set(tileKey(tile), tile);
  }
  const tiles = await loadRequiredTiles([...required.values()], signal, onProgress);
  return {
    ...journey,
    overviewRouteSegments: overviewSegments,
    cameraTrack,
    overviewViewport: endingOverview,
    tiles,
    distanceAtProgress,
  };
}

function pointAtProgress(journey: PreparedJourney, progress: number): { point: WorldPoint; completedIndex: number } {
  const distanceKm = journey.distanceAtProgress(progress);
  const position = worldPositionAtDistance(journey, distanceKm);
  return { point: position.point, completedIndex: position.fromIndex };
}

function strokeRoute(
  context: CanvasRenderingContext2D,
  points: WorldPoint[],
  head: WorldPoint,
  viewport: Viewport,
  width: number,
  height: number,
): void {
  if (points.length === 0) return;
  context.beginPath();
  points.forEach((point, index) => {
    const [x, y] = worldToCanvas(point, viewport, width, height);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  const [headX, headY] = worldToCanvas(head, viewport, width, height);
  context.lineTo(headX, headY);
  context.stroke();
}

export function drawFrame(
  canvas: HTMLCanvasElement,
  journey: PreparedJourney,
  frame: TimelineFrame,
  title: string,
  periodLabel: string,
  style: DrawStyle = DEFAULT_STYLE,
): void {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('無法使用 Canvas 繪製。');
  const width = canvas.width;
  const height = canvas.height;
  const size = Math.max(width, height);
  context.clearRect(0, 0, width, height);
  const journeyViewport = cameraViewportAt(journey.cameraTrack, frame.journeyProgress);
  const viewport = frame.outroProgress <= 0
    ? journeyViewport
    : blendViewport(journeyViewport, journey.overviewViewport, easeOutCubic(frame.outroProgress), size);
  drawMapBackground(canvas, viewport, journey.tiles);

  const current = pointAtProgress(journey, frame.journeyProgress);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  const activeAlpha = 1 - easeOutCubic(frame.outroProgress);
  context.save();
  context.globalAlpha = activeAlpha;
  const traveled = journey.worldPoints.slice(0, current.completedIndex + 1);
  context.strokeStyle = style.routeFade;
  context.lineWidth = Math.max(4, size / 144);
  strokeRoute(context, traveled, current.point, viewport, width, height);

  const currentDistance = journey.distanceAtProgress(frame.journeyProgress);
  const recentStartDistance = Math.max(0, currentDistance - Math.max(80, journey.totalDistanceKm * 0.16));
  const recentStartIndex = Math.max(
    0,
    journey.cumulativeDistanceKm.findIndex((distance) => distance >= recentStartDistance),
  );
  context.strokeStyle = style.route;
  context.lineWidth = Math.max(6, size / 90);
  strokeRoute(
    context,
    journey.worldPoints.slice(recentStartIndex, current.completedIndex + 1),
    current.point,
    viewport,
    width,
    height,
  );
  const [headX, headY] = worldToCanvas(current.point, viewport, width, height);

  context.shadowColor = 'rgba(36, 25, 29, 0.35)';
  context.shadowBlur = 10;
  context.fillStyle = style.marker;
  context.beginPath();
  context.arc(headX, headY, Math.max(8, size / 72), 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = style.markerRing;
  context.lineWidth = Math.max(4, size / 144);
  context.beginPath();
  context.arc(headX, headY, Math.max(13, size / 45), 0, Math.PI * 2);
  context.stroke();
  context.restore();

  if (frame.outroProgress > 0) {
    context.save();
    context.globalAlpha = (190 / 255) * easeInOutCubic(frame.outroProgress);
    context.strokeStyle = style.route;
    context.lineWidth = Math.max(3, size / 200);
    for (const segment of journey.overviewRouteSegments) {
      strokeRoute(
        context,
        segment.slice(0, -1),
        segment.at(-1) ?? current.point,
        viewport,
        width,
        height,
      );
    }
    context.restore();
  }

  const scale = size / 720;
  const bannerHeight = style.placeLabel ? 132 * scale : 104 * scale;
  context.fillStyle = style.titleBg;
  context.beginPath();
  context.roundRect(34 * scale, 28 * scale, width - 68 * scale, bannerHeight, 24 * scale);
  context.fill();
  context.textAlign = 'center';
  context.fillStyle = style.title;
  context.font = `700 ${34 * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
  context.fillText(title || '我的旅程', width / 2, 72 * scale, width - 104 * scale);
  context.fillStyle = style.subtitle;
  context.font = `${20 * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
  context.fillText(periodLabel, width / 2, 108 * scale);
  if (style.placeLabel) {
    context.fillStyle = style.route;
    context.font = `700 ${22 * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
    context.fillText(style.placeLabel, width / 2, 138 * scale);
  }

  context.textAlign = 'right';
  context.fillStyle = 'rgba(36, 25, 29, 0.78)';
  context.font = `${13 * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
  context.fillText('© OpenStreetMap contributors  © CARTO', width - 12 * scale, height - 12 * scale);
}
