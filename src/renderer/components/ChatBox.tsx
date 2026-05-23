import { Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

interface ChatBoxProps {
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}

export default function ChatBox({ open, onClose, onSend }: ChatBoxProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    onSend(trimmed);
    setText("");
  }

  return (
    <form className="chat-box" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        value={text}
        maxLength={160}
        placeholder="Say something..."
        onChange={(event) => setText(event.target.value)}
      />
      <button type="submit" aria-label="Send">
        <Send size={16} />
      </button>
      <button type="button" aria-label="Close chat" onClick={onClose}>
        <X size={16} />
      </button>
    </form>
  );
}
