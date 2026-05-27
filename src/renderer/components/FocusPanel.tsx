import { X } from "lucide-react";

interface FocusPanelProps {
  open: boolean;
  selectedMinutes: number;
  onMinutesChange: (minutes: number) => void;
  onStartFocus: () => void;
  onStartBreak: () => void;
  onClose: () => void;
}

const focusPresets = [15, 25, 30, 45];

export default function FocusPanel({
  open,
  selectedMinutes,
  onMinutesChange,
  onStartFocus,
  onStartBreak,
  onClose
}: FocusPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <section className="focus-panel" onPointerDown={(event) => event.stopPropagation()}>
      <header className="focus-panel-header">
        <strong>Focus timer</strong>
        <button type="button" aria-label="Close focus panel" onClick={onClose}>
          <X size={14} />
        </button>
      </header>

      <div className="focus-presets" aria-label="Focus duration">
        {focusPresets.map((minutes) => (
          <button
            type="button"
            className={selectedMinutes === minutes ? "focus-preset-active" : ""}
            onClick={() => onMinutesChange(minutes)}
            key={minutes}
          >
            {minutes}m
          </button>
        ))}
      </div>

      <label className="focus-custom">
        <span>Minutes</span>
        <input
          type="number"
          min={1}
          max={180}
          value={selectedMinutes}
          onChange={(event) => onMinutesChange(clampMinutes(Number(event.target.value)))}
        />
      </label>

      <div className="focus-panel-actions">
        <button type="button" onClick={onStartBreak}>
          Break
        </button>
        <button type="button" className="focus-primary" onClick={onStartFocus}>
          Start
        </button>
      </div>
    </section>
  );
}

function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) {
    return 25;
  }

  return Math.min(180, Math.max(1, Math.round(value)));
}
