export type FocusMode = "focus" | "break";

export type FocusStatus = "idle" | "running" | "paused";

export interface FocusSession {
  id: string;
  mode: FocusMode;
  status: FocusStatus;
  durationMs: number;
  startedAt: number;
  endsAt: number;
  pausedRemainingMs?: number;
  createdAt: number;
  updatedAt: number;
}

export interface FocusState {
  session: FocusSession | null;
  completedSession?: FocusSession;
}

export type FocusIntent =
  | { type: "start_focus"; minutes: number }
  | { type: "start_break"; minutes: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "cancel" }
  | { type: "query" };
