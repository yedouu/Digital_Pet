import { X } from "lucide-react";

export type BubbleType = "normal" | "thinking" | "error" | "system";

export interface SpeechBubbleData {
  id: string;
  text: string;
  type: BubbleType;
  duration: number;
  createdAt: number;
  closable?: boolean;
}

interface SpeechBubbleProps {
  bubble: SpeechBubbleData | null;
  onClose: () => void;
}

export function truncateBubbleText(text: string): string {
  return text;
}

export default function SpeechBubble({ bubble, onClose }: SpeechBubbleProps) {
  if (!bubble) {
    return null;
  }

  return (
    <div className={`speech-bubble speech-bubble-${bubble.type}`} role="status">
      <span className="speech-bubble-text">{truncateBubbleText(bubble.text)}</span>
      {bubble.closable ? (
        <button type="button" aria-label="Close message" onClick={onClose}>
          <X size={13} />
        </button>
      ) : null}
    </div>
  );
}
