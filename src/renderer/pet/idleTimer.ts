let lastInteractionTime = Date.now();

export function resetIdleTimer() {
  lastInteractionTime = Date.now();
}

export function shouldEnterSleep(timeoutMs: number): boolean {
  return Date.now() - lastInteractionTime > timeoutMs;
}
