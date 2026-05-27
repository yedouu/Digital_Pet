import { EyeOff, MessageCircle, Power, RefreshCcw, Settings, Timer } from "lucide-react";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuProps {
  open: boolean;
  position: ContextMenuPosition;
  onChat: () => void;
  onFocus: () => void;
  onRandomLine: () => void;
  onHide: () => void;
  onSettings: () => void;
  onExit: () => void;
  onClose: () => void;
  focusEnabled?: boolean;
}

export default function ContextMenu({
  open,
  position,
  onChat,
  onFocus,
  onRandomLine,
  onHide,
  onSettings,
  onExit,
  onClose,
  focusEnabled = true
}: ContextMenuProps) {
  if (!open) {
    return null;
  }

  function run(action: () => void) {
    action();
    onClose();
  }

  return (
    <div
      className="context-menu"
      style={{ left: position.x, top: position.y }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button type="button" onClick={() => run(onChat)}>
        <MessageCircle size={15} />
        <span>Chat</span>
      </button>
      {focusEnabled ? (
        <button type="button" onClick={() => run(onFocus)}>
          <Timer size={15} />
          <span>Focus</span>
        </button>
      ) : null}
      <button type="button" onClick={() => run(onRandomLine)}>
        <RefreshCcw size={15} />
        <span>New line</span>
      </button>
      <button type="button" onClick={() => run(onHide)}>
        <EyeOff size={15} />
        <span>Hide</span>
      </button>
      <button type="button" onClick={() => run(onSettings)}>
        <Settings size={15} />
        <span>Settings</span>
      </button>
      <button type="button" onClick={() => run(onExit)}>
        <Power size={15} />
        <span>Exit</span>
      </button>
    </div>
  );
}
