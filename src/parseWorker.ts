/// <reference lib="webworker" />

self.onmessage = async (event: MessageEvent<{ id: number; text: string }>) => {
  const { id, text } = event.data;
  try {
    const data = JSON.parse(text) as unknown;
    (self as DedicatedWorkerGlobalScope).postMessage({ id, ok: true, data });
  } catch (error) {
    (self as DedicatedWorkerGlobalScope).postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'JSON parse failed',
    });
  }
};
