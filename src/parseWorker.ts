/// <reference lib="webworker" />

/**
 * Parses JSON off the main thread. For very large files the text is transferred
 * as an ArrayBuffer when possible to avoid duplicating the string on the main thread.
 */
self.onmessage = async (event: MessageEvent<{ id: number; text?: string; buffer?: ArrayBuffer }>) => {
  const { id, text, buffer } = event.data;
  try {
    const source = text ?? new TextDecoder().decode(buffer);
    const data = JSON.parse(source) as unknown;
    (self as DedicatedWorkerGlobalScope).postMessage({ id, ok: true, data });
  } catch (error) {
    (self as DedicatedWorkerGlobalScope).postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'JSON parse failed',
    });
  }
};
