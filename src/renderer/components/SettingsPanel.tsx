import { X } from "lucide-react";
import type { ChatMode } from "../pet/petTypes";

interface SettingsPanelProps {
  open: boolean;
  chatMode: ChatMode;
  deepseekApiKey: string;
  onChatModeChange: (mode: ChatMode) => void;
  onDeepseekApiKeyChange: (apiKey: string) => void;
  onClose: () => void;
}

export default function SettingsPanel({
  open,
  chatMode,
  deepseekApiKey,
  onChatModeChange,
  onDeepseekApiKeyChange,
  onClose
}: SettingsPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <section className="settings-panel">
      <div className="settings-header">
        <strong>Settings</strong>
        <button type="button" aria-label="Close settings" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <label>
        Chat mode
        <select value={chatMode} onChange={(event) => onChatModeChange(event.target.value as ChatMode)}>
          <option value="ai">DeepSeek API</option>
          <option value="local">Local fallback</option>
        </select>
      </label>
      <label>
        DeepSeek API Key
        <input
          type="password"
          value={deepseekApiKey}
          placeholder="Loaded from .env.local or enter here"
          autoComplete="off"
          onChange={(event) => onDeepseekApiKeyChange(event.target.value)}
        />
      </label>
    </section>
  );
}
