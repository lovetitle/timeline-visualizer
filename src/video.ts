import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
} from 'mediabunny';
import { frameAtElapsedSeconds } from './animation';
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
  locale: 'zh' | 'en';
  audioBuffer?: AudioBuffer | null;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

export function hasVideoEncoder(): boolean {
  return typeof globalThis.VideoEncoder !== 'undefined';
}

export async function canCreateMp4(width = 480, height = 480): Promise<boolean> {
  if (!hasVideoEncoder()) return false;
  try {
    const result = await VideoEncoder.isConfigSupported({
      codec: 'avc1.42001f',
      width,
      height,
      bitrate: 2_500_000,
      framerate: 24,
      hardwareAcceleration: 'no-preference',
    });
    return result.supported === true;
  } catch {
    return false;
  }
}

export function isMp4(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 12) return false;
  const bytes = new Uint8Array(buffer, 4, 8);
  return String.fromCharCode(...bytes).startsWith('ftyp');
}

function bitrateForSize(width: number, height: number): number {
  const pixels = width * height;
  if (pixels >= 1920 * 1080) return 8_000_000;
  if (pixels >= 1080 * 1080) return 5_000_000;
  if (pixels >= 720 * 720) return 3_500_000;
  return 2_500_000;
}

export async function createJourneyMp4(
  canvas: HTMLCanvasElement,
  journey: PreparedJourney,
  options: ExportOptions,
): Promise<Blob> {
  if (!hasVideoEncoder()) {
    throw new Error('這個瀏覽器無法產出 MP4。請改用支援 WebCodecs 與 H.264 的 Chrome、Edge 或 Safari 16.4 以上。');
  }

  const fps = 24;
  const frameDuration = 1 / fps;
  const journeyFrameCount = Math.max(1, Math.round(options.durationSeconds * fps));
  const outroFrameCount = Math.round(Math.max(1.5, options.outroHoldSeconds) * fps);
  const frameCount = journeyFrameCount + outroFrameCount;
  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  });
  const source = new CanvasSource(canvas, {
    codec: 'avc',
    fullCodecString: 'avc1.42001f',
    quality: new Quality({ bitrate: bitrateForSize(canvas.width, canvas.height) }),
    keyFrameInterval: 1,
    hardwareAcceleration: 'no-preference',
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
    drawFrame(canvas, journey, animationFrame, options.title, options.periodLabel, {
      ...options.style,
      placeLabel,
    });
    await source.add(frame * frameDuration, frameDuration, { keyFrame: frame % fps === 0 });
    options.onProgress?.((frame + 1) / frameCount);
  }

  await output.finalize();
  if (!target.buffer) throw new Error('影片編碼器沒有產出 MP4 檔。');
  if (!isMp4(target.buffer)) throw new Error('影片編碼器產出的 MP4 無效。');
  return new Blob([target.buffer], { type: 'video/mp4' });
}
