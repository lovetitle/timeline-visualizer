import { easeInOutCubic, easeOutCubic } from './animation';
import {
  blendViewport,
  buildCameraTrack,
  cameraViewportAt,
  overviewViewport,
  worldPositionAtDistance,
} from './camera';
import { cumulativeDistances, overviewRouteSegments, project, unwrapWorldPoints } from './geo';
import { tileCachePrefix, tileUrlTemplate, type MapStyleId, type MarkerStyleId } from './mapStyles';
import { getCachedTile, setCachedTile } from './tileCache';
import type { Locale } from './i18n';
import { createActivityDistanceAtProgress } from './activity';
import { recordTileRequest } from './privacyReport';
import { withRetry } from './retry';
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

const DEFAULT_STYLE: DrawStyle = {
  route: '#c45c26',
  routeFade: 'rgba(196, 92, 38, 0.34)',
  marker: '#1c2a24',
  markerRing: '#c45c26',
  titleBg: 'rgba(255, 248, 242, 0.88)',
  title: '#1c2a24',
  subtitle: '#5d6b64',
  markerStyle: 'dot',
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

function loadImageOnce(url: string, cacheKey: string, signal?: AbortSignal): Promise<HTMLImageElement> {
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
    void getCachedTile(cacheKey).then(async (cached) => {
      if (cached) {
        image.src = URL.createObjectURL(cached);
        return;
      }
      try {
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error('tile fetch failed');
        const blob = await response.blob();
        void setCachedTile(cacheKey, blob);
        image.src = URL.createObjectURL(blob);
      } catch (error) {
        if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
          abort();
          return;
        }
        image.src = url;
      }
    });
  });
}

function loadImage(url: string, cacheKey: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return withRetry(() => loadImageOnce(url, cacheKey, signal), { retries: 2, delayMs: 350 });
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
  mapStyle: MapStyleId,
  locale: Locale,
  signal?: AbortSignal,
  onProgress?: (completed: number, total: number) => void,
): Promise<Map<string, HTMLImageElement>> {
  const tiles = new Map<string, HTMLImageElement>();
  const template = tileUrlTemplate(mapStyle, locale);
  const cachePrefix = tileCachePrefix(mapStyle, locale);
  let nextIndex = 0;
  let completed = 0;
  const worker = async (): Promise<void> => {
    while (nextIndex < coordinates.length) {
      if (signal?.aborted) throw new DOMException('已取消產出影片。', 'AbortError');
      const coordinate = coordinates[nextIndex];
      nextIndex += 1;
      const url = template.replace('{z}', String(coordinate.zoom))
        .replace('{x}', String(coordinate.x))
        .replace('{y}', String(coordinate.y));
      const key = `${cachePrefix}:${tileKey(coordinate)}`;
      recordTileRequest(coordinate.zoom, coordinate.x, coordinate.y, `${mapStyle}:${locale}`);
      try {
        tiles.set(tileKey(coordinate), await loadImage(url, key, signal));
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
  mapStyle: MapStyleId = 'light',
  signal?: AbortSignal,
  onProgress?: (completed: number, total: number) => void,
  useActivityPace = false,
  locale: Locale = 'zh',
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
  const activityPace = useActivityPace
    ? createActivityDistanceAtProgress(points, distances)
    : null;
  const distanceAtProgress = activityPace ?? createDistanceAtProgress(distances, compression);
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
  const tiles = await loadRequiredTiles([...required.values()], mapStyle, locale, signal, onProgress);
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

function drawMarker(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  markerStyle: MarkerStyleId,
  fill: string,
  ring: string,
): void {
  const radius = Math.max(8, size / 72);
  context.fillStyle = fill;
  context.strokeStyle = ring;
  context.lineWidth = Math.max(3, size / 160);
  if (markerStyle === 'plane') {
    context.beginPath();
    context.moveTo(x, y - radius * 1.6);
    context.lineTo(x + radius * 1.2, y + radius);
    context.lineTo(x, y + radius * 0.4);
    context.lineTo(x - radius * 1.2, y + radius);
    context.closePath();
    context.fill();
    context.stroke();
    return;
  }
  if (markerStyle === 'foot') {
    context.beginPath();
    context.ellipse(x - radius * 0.45, y, radius * 0.55, radius * 0.9, -0.25, 0, Math.PI * 2);
    context.ellipse(x + radius * 0.45, y + radius * 0.15, radius * 0.5, radius * 0.85, 0.25, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    return;
  }
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(x, y, radius * 1.55, 0, Math.PI * 2);
  context.stroke();
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

  if (style.gradeOverlay) {
    context.fillStyle = style.gradeOverlay;
    context.fillRect(0, 0, width, height);
  }

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

  if (style.compareWorldPoints && style.compareWorldPoints.length > 1) {
    context.save();
    context.globalAlpha = Math.max(0.05, Math.min(1, style.compareOpacity ?? 0.35));
    context.strokeStyle = '#1f6feb';
    context.lineWidth = Math.max(3, size / 160);
    strokeRoute(
      context,
      style.compareWorldPoints.slice(0, -1),
      style.compareWorldPoints.at(-1)!,
      viewport,
      width,
      height,
    );
    context.restore();
  }

  context.shadowColor = 'rgba(36, 25, 29, 0.35)';
  context.shadowBlur = 10;
  drawMarker(context, headX, headY, size, style.markerStyle ?? 'dot', style.marker, style.markerRing);
  context.shadowBlur = 0;
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
  const bannerHeight = (style.placeLabel || style.chapterLabel) ? 150 * scale : 104 * scale;
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
  if (style.chapterLabel) {
    context.fillStyle = style.route;
    context.font = `700 ${20 * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
    context.fillText(style.chapterLabel, width / 2, 136 * scale);
  }
  if (style.placeLabel) {
    context.fillStyle = style.route;
    context.font = `700 ${(style.burnCaptions ? 26 : 22) * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
    context.fillText(style.placeLabel, width / 2, style.chapterLabel ? 162 * scale : 138 * scale);
  }
  if (style.burnCaptions && (style.chapterLabel || style.placeLabel)) {
    const caption = style.chapterLabel || style.placeLabel || '';
    context.fillStyle = 'rgba(28,42,36,0.78)';
    const boxW = Math.min(width * 0.88, Math.max(180 * scale, context.measureText(caption).width + 48 * scale));
    const boxY = height - 78 * scale;
    context.beginPath();
    context.roundRect((width - boxW) / 2, boxY, boxW, 48 * scale, 12 * scale);
    context.fill();
    context.fillStyle = '#f6f3ee';
    context.font = `700 ${22 * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
    context.textAlign = 'center';
    context.fillText(caption, width / 2, boxY + 32 * scale, boxW - 24 * scale);
  }

  if (style.stayMarkers?.length) {
    context.save();
    const pulse = 0.65 + 0.35 * Math.sin((style.journeyPulse ?? 0) * Math.PI * 2);
    for (const marker of style.stayMarkers) {
      const radius = Math.max(5, size / 100) * pulse;
      context.beginPath();
      context.fillStyle = 'rgba(196,92,38,0.22)';
      context.arc(marker.x, marker.y, radius * 2.2, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.fillStyle = 'rgba(196,92,38,0.95)';
      context.arc(marker.x, marker.y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  if (style.splitCompareProgress !== undefined && style.compareWorldPoints && style.compareWorldPoints.length > 1) {
    const splitX = width * Math.max(0.05, Math.min(0.95, style.splitCompareProgress));
    context.save();
    context.beginPath();
    context.rect(splitX, 0, width - splitX, height);
    context.clip();
    context.globalAlpha = 0.55;
    context.strokeStyle = '#1f6feb';
    context.lineWidth = Math.max(3, size / 140);
    strokeRoute(
      context,
      style.compareWorldPoints.slice(0, -1),
      style.compareWorldPoints.at(-1)!,
      viewport,
      width,
      height,
    );
    context.restore();
    context.strokeStyle = 'rgba(246,243,238,0.9)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(splitX, 0);
    context.lineTo(splitX, height);
    context.stroke();
  }

  if ((style.introProgress ?? 0) > 0 && style.introTitle) {
    const alpha = Math.min(1, style.introProgress! * 2);
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = 'rgba(28,42,36,0.55)';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#f6f3ee';
    context.textAlign = 'center';
    context.font = `700 ${42 * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
    context.fillText(style.introTitle, width / 2, height * 0.45, width * 0.86);
    if (style.introSubtitle) {
      context.font = `${22 * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
      context.fillText(style.introSubtitle, width / 2, height * 0.52, width * 0.86);
    }
    context.restore();
  }

  if (style.hudText) {
    context.textAlign = 'left';
    context.fillStyle = 'rgba(28,42,36,0.72)';
    context.beginPath();
    context.roundRect(16 * scale, height - 52 * scale, Math.min(width * 0.55, 280 * scale), 36 * scale, 10 * scale);
    context.fill();
    context.fillStyle = '#f6f3ee';
    context.font = `650 ${16 * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
    context.fillText(style.hudText, 28 * scale, height - 28 * scale, width * 0.5);
  }

  if (style.showAttribution !== false) {
    context.textAlign = 'right';
    context.fillStyle = 'rgba(36, 25, 29, 0.78)';
    context.font = `${13 * scale}px "Segoe UI", "PingFang TC", "Noto Sans TC", sans-serif`;
    context.fillText(
      style.attributionText || '© OpenStreetMap contributors  © CARTO',
      width - 12 * scale,
      height - 12 * scale,
    );
  }
}
