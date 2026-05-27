import { useState } from "react";
import { formatFocusTime, getRemainingMs } from "../focus/focusService";
import type { FocusSession } from "../focus/focusTypes";

interface FocusTimerProps {
  session: FocusSession | null;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export default function FocusTimer({ session, onPause, onResume, onCancel }: FocusTimerProps) {
  const [controlsOpen, setControlsOpen] = useState(false);

  if (!session) {
    return null;
  }

  const label = session.mode === "focus" ? "Focus" : "Break";
  const status = session.status === "paused" ? "Paused" : label;

  return (
    <div className="focus-timer-wrap" onPointerDown={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={`focus-timer focus-timer-${session.status}`}
        aria-label={`${label} timer controls`}
        onClick={() => setControlsOpen((open) => !open)}
      >
        <span>{status}</span>
        <strong>{formatFocusTime(getRemainingMs(session))}</strong>
      </button>

      {controlsOpen ? (
        <div className="focus-timer-menu">
          <button
            type="button"
            onClick={() => {
              if (session.status === "paused") {
                onResume();
              } else {
                onPause();
              }
              setControlsOpen(false);
            }}
          >
            {session.status === "paused" ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => {
              onCancel();
              setControlsOpen(false);
            }}
          >
            End
          </button>
        </div>
      ) : null}
    </div>
  );
}
