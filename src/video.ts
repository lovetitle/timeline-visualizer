import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
} from 'mediabunny';
import { frameAtElapsedSeconds } from './animation';
import { chapterLabelFor } from './chapters';
import { placeLabelAtProgress } from './places';
import { drawFrame } from './renderer';
import type { DrawStyle, PreparedJourney } from './types';

export interface ExportOptions {
  durationSeconds: number;
  title: string;
  periodLabel: string;
  style: DrawStyle;
  outroHoldSeconds: number;
  showPlaceLabels: boolean;
  chapterMode: string;
  locale: 'zh' | 'en';
  audioBuffer?: AudioBuffer | null;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
  /** When paused is true, encoding waits without aborting. */
  pauseGate?: { paused: boolean };
}

export function hasVideoEncoder(): boolean {
  return typeof globalThis.VideoEncoder !== 'undefined';
}

/** H.264 needs even dimensions; many encoders prefer multiples of 2. */
export function alignEncodeSize(value: number): number {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded + 1;
}

function bitrateForSize(width: number, height: number): number {
  const pixels = width * height;
  if (pixels >= 1920 * 1080) return 8_000_000;
  if (pixels >= 1080 * 1080) return 5_000_000;
  if (pixels >= 720 * 720) return 3_500_000;
  return 2_500_000;
}

/**
 * Level 3.1 (…01f) tops out near 720p. 1080p / 1080×1920 need Level 4.0+ (…28 / …29).
 * Probe several profiles so hardware encoders that reject Baseline still work.
 */
export function codecCandidatesForSize(width: number, height: number): Array<string | undefined> {
  const longEdge = Math.max(width, height);
  if (longEdge <= 720) {
    return [
      undefined, // let mediabunny pick
      'avc1.42001f',
      'avc1.4D401F',
      'avc1.64001F',
    ];
  }
  return [
    undefined,
    'avc1.4D4028', // Main @ L4.0
    'avc1.640028', // High @ L4.0
    'avc1.420028', // Baseline @ L4.0
    'avc1.4D4029', // Main @ L4.1
    'avc1.640029', // High @ L4.1
  ];
}

export async function findSupportedAvcCodec(
  width: number,
  height: number,
  bitrate = bitrateForSize(width, height),
): Promise<string | undefined | null> {
  if (!hasVideoEncoder()) return null;
  for (const codec of codecCandidatesForSize(width, height)) {
    try {
      const result = await VideoEncoder.isConfigSupported({
        codec: codec ?? 'avc1.4D4028',
        width,
        height,
        bitrate,
        framerate: 24,
        hardwareAcceleration: 'no-preference',
      });
      if (result.supported) return codec;
    } catch {
      // try next
    }
  }
  // Last resort: ask without an explicit string (some browsers only accept default probing).
  try {
    const soft = await VideoEncoder.isConfigSupported({
      codec: 'avc1.640028',
      width,
      height,
      bitrate,
      framerate: 24,
      hardwareAcceleration: 'prefer-software',
    });
    if (soft.supported) return 'avc1.640028';
  } catch {
    // ignore
  }
  return null;
}

export async function canCreateMp4(width = 480, height = 480): Promise<boolean> {
  const w = alignEncodeSize(width);
  const h = alignEncodeSize(height);
  const codec = await findSupportedAvcCodec(w, h);
  return codec !== null;
}

export function isMp4(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 12) return false;
  const bytes = new Uint8Array(buffer, 4, 8);
  return String.fromCharCode(...bytes).startsWith('ftyp');
}

async function encodeWithCodec(
  canvas: HTMLCanvasElement,
  journey: PreparedJourney,
  options: ExportOptions,
  fullCodecString: string | undefined,
  hardwareAcceleration: 'no-preference' | 'prefer-software',
): Promise<Blob> {
  const fps = 24;
  const frameDuration = 1 / fps;
  const journeyFrameCount = Math.max(1, Math.round(options.durationSeconds * fps));
  const outroFrameCount = Math.round(Math.max(1.5, options.outroHoldSeconds) * fps);
  const frameCount = journeyFrameCount + outroFrameCount;
  const bitrate = bitrateForSize(canvas.width, canvas.height);
  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  });
  const source = new CanvasSource(canvas, {
    codec: 'avc',
    ...(fullCodecString ? { fullCodecString } : {}),
    quality: new Quality({ bitrate }),
    keyFrameInterval: 1,
    hardwareAcceleration,
  });
  output.addVideoTrack(source, { frameRate: fps });

  let audioSource: AudioBufferSource | null = null;
  if (options.audioBuffer) {
    try {
      audioSource = new AudioBufferSource({ codec: 'aac', bitrate: 128_000 });
      output.addAudioTrack(audioSource);
    } catch {
      audioSource = null;
    }
  }

  output.setMetadataTags({ title: options.title });
  await output.start();
  if (audioSource && options.audioBuffer) {
    try {
      await audioSource.add(options.audioBuffer);
    } catch {
      // Keep video-only if audio encoding is unsupported.
    }
  }

  for (let frame = 0; frame < frameCount; frame += 1) {
    while (options.pauseGate?.paused) {
      if (options.signal?.aborted) {
        await output.cancel();
        throw new DOMException('已取消產出影片。', 'AbortError');
      }
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    if (options.signal?.aborted) {
      await output.cancel();
      throw new DOMException('已取消產出影片。', 'AbortError');
    }
    const animationFrame = frame < journeyFrameCount
      ? {
        journeyProgress: journeyFrameCount === 1 ? 1 : frame / (journeyFrameCount - 1),
        outroProgress: 0,
      }
      : frameAtElapsedSeconds(
        options.durationSeconds + (frame - journeyFrameCount) / fps,
        options.durationSeconds,
        options.outroHoldSeconds,
      );
    const placeLabel = options.showPlaceLabels
      ? placeLabelAtProgress(
        journey.points,
        journey.cumulativeDistanceKm,
        animationFrame.journeyProgress,
        options.locale,
      )
      : null;
    const chapterLabel = chapterLabelFor(
      options.chapterMode,
      journey.points,
      journey.cumulativeDistanceKm,
      animationFrame.journeyProgress,
      options.locale,
    );
    drawFrame(canvas, journey, animationFrame, options.title, options.periodLabel, {
      ...options.style,
      placeLabel,
      chapterLabel,
    });
    await source.add(frame * frameDuration, frameDuration, { keyFrame: frame % fps === 0 });
    options.onProgress?.((frame + 1) / frameCount);
  }

  await output.finalize();
  if (!target.buffer) throw new Error('影片編碼器沒有產出 MP4 檔。');
  if (!isMp4(target.buffer)) throw new Error('影片編碼器產出的 MP4 無效。');
  return new Blob([target.buffer], { type: 'video/mp4' });
}

export async function createJourneyMp4(
  canvas: HTMLCanvasElement,
  journey: PreparedJourney,
  options: ExportOptions,
): Promise<Blob> {
  if (!hasVideoEncoder()) {
    throw new Error('這個瀏覽器無法產出 MP4。請改用支援 WebCodecs 與 H.264 的 Chrome、Edge 或 Safari 16.4 以上。');
  }

  const width = alignEncodeSize(canvas.width);
  const height = alignEncodeSize(canvas.height);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const preferred = await findSupportedAvcCodec(width, height);
  if (preferred === null) {
    throw new Error(
      `此瀏覽器無法以 ${width}×${height} 編碼 H.264。請改選 720p／480p，或更新 Chrome／Edge。`,
    );
  }

  const attempts: Array<{ codec: string | undefined; hardware: 'no-preference' | 'prefer-software' }> = [
    { codec: preferred, hardware: 'no-preference' },
    { codec: preferred, hardware: 'prefer-software' },
    ...codecCandidatesForSize(width, height)
      .filter((codec) => codec !== preferred)
      .flatMap((codec) => ([
        { codec, hardware: 'no-preference' as const },
        { codec, hardware: 'prefer-software' as const },
      ])),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    if (options.signal?.aborted) {
      throw new DOMException('已取消產出影片。', 'AbortError');
    }
    try {
      return await encodeWithCodec(canvas, journey, options, attempt.codec, attempt.hardware);
    } catch (error) {
      lastError = error;
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      // Try next codec / acceleration mode.
    }
  }

  if (lastError instanceof Error && /WebCodecs|H\.264|encoder|encode|不支援|cannot/i.test(lastError.message)) {
    throw new Error(
      `無法以 ${width}×${height} 編碼影片。請改選較低解析度（720p／480p）後再試。`,
    );
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`無法以 ${width}×${height} 編碼影片。請改選較低解析度後再試。`);
}
