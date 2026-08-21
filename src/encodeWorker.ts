/**
 * Video encode stays on the main thread because mediabunny CanvasSource
 * and WebCodecs VideoEncoder need a live canvas/frame source.
 * Heavy JSON parse already runs in parseWorker (threshold 500KB).
 * This module reserves a future OffscreenCanvas transfer path.
 */
export const ENCODE_WORKER_SUPPORTED = false;

export function encodeWorkerStatus(locale: string): string {
  if (locale === 'en') return 'Encode runs on the main thread; JSON parse uses a worker.';
  if (locale === 'ja') return 'エンコードはメインスレッド、JSON 解析は Worker。';
  if (locale === 'ko') return '인코딩은 메인 스레드, JSON 파싱은 Worker.';
  return '影片編碼在主執行緒；大型 JSON 解析使用 Worker。';
}
