import type { FocusMode, FocusSession, FocusState } from "./focusTypes";

const focusStorageKey = "bubu_focus_state";

export function loadFocusState(): FocusState {
  const raw = window.localStorage.getItem(focusStorageKey);

  if (!raw) {
    return { session: null };
  }

  try {
    return normalizeFocusState(JSON.parse(raw) as FocusState);
  } catch {
    return { session: null };
  }
}

export function saveFocusState(state: FocusState) {
  window.localStorage.setItem(focusStorageKey, JSON.stringify(state));
}

export function startFocusSession(mode: FocusMode, minutes: number): FocusState {
  const now = Date.now();
  const durationMs = Math.max(1, Math.round(minutes)) * 60 * 1000;

  return {
    session: {
      id: `${now}-${Math.random().toString(36).slice(2)}`,
      mode,
      status: "running",
      durationMs,
      startedAt: now,
      endsAt: now + durationMs,
      createdAt: now,
      updatedAt: now
    }
  };
}

export function pauseFocusSession(state: FocusState): FocusState {
  const session = state.session;

  if (!session || session.status !== "running") {
    return state;
  }

  return {
    session: {
      ...session,
      status: "paused",
      pausedRemainingMs: getRemainingMs(session),
      updatedAt: Date.now()
    }
  };
}

export function resumeFocusSession(state: FocusState): FocusState {
  const session = state.session;

  if (!session || session.status !== "paused") {
    return state;
  }

  const now = Date.now();
  const remainingMs = session.pausedRemainingMs ?? session.durationMs;

  return {
    session: {
      ...session,
      status: "running",
      endsAt: now + remainingMs,
      pausedRemainingMs: undefined,
      updatedAt: now
    }
  };
}

export function cancelFocusSession(): FocusState {
  return { session: null };
}

export function normalizeFocusState(state: FocusState): FocusState {
  const session = state.session;

  if (!session) {
    return { session: null };
  }

  if (session.status === "running" && getRemainingMs(session) <= 0) {
    return {
      session: null,
      completedSession: {
        ...session,
        status: "idle",
        updatedAt: Date.now()
      }
    };
  }

  return { session };
}

export function getRemainingMs(session: FocusSession): number {
  if (session.status === "paused") {
    return Math.max(0, session.pausedRemainingMs ?? session.durationMs);
  }

  return Math.max(0, session.endsAt - Date.now());
}

export function formatFocusTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
