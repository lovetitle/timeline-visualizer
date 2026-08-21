export async function withRetry<T>(
  action: (attempt: number) => Promise<T>,
  options: { retries?: number; delayMs?: number; shouldRetry?: (error: unknown) => boolean } = {},
): Promise<T> {
  const retries = options.retries ?? 2;
  const delayMs = options.delayMs ?? 400;
  const shouldRetry = options.shouldRetry ?? ((error: unknown) => !(
    error instanceof DOMException && error.name === 'AbortError'
  ));
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await action(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !shouldRetry(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}
