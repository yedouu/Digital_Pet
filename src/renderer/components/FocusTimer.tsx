import { formatFocusTime, getRemainingMs } from "../focus/focusService";
import type { FocusSession } from "../focus/focusTypes";

interface FocusTimerProps {
  session: FocusSession | null;
}

export default function FocusTimer({ session }: FocusTimerProps) {
  if (!session) {
    return null;
  }

  const label = session.mode === "focus" ? "Focus" : "Break";
  const status = session.status === "paused" ? "Paused" : label;

  return (
    <div className={`focus-timer focus-timer-${session.status}`} aria-label={`${label} timer`}>
      <span>{status}</span>
      <strong>{formatFocusTime(getRemainingMs(session))}</strong>
    </div>
  );
}
