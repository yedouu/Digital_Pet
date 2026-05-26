import { X } from "lucide-react";
import type { ChatMode, TimeZoneMode } from "../pet/petTypes";

interface SettingsPanelProps {
  open: boolean;
  chatMode: ChatMode;
  timeZoneMode: TimeZoneMode;
  deepseekApiKey: string;
  autostartEnabled: boolean;
  autostartPending: boolean;
  inputSyncEnabled: boolean;
  onChatModeChange: (mode: ChatMode) => void;
  onTimeZoneModeChange: (mode: TimeZoneMode) => void;
  onDeepseekApiKeyChange: (apiKey: string) => void;
  onAutostartChange: (enabled: boolean) => void;
  onInputSyncChange: (enabled: boolean) => void;
  onClose: () => void;
}

export default function SettingsPanel({
  open,
  chatMode,
  timeZoneMode,
  deepseekApiKey,
  autostartEnabled,
  autostartPending,
  inputSyncEnabled,
  onChatModeChange,
  onTimeZoneModeChange,
  onDeepseekApiKeyChange,
  onAutostartChange,
  onInputSyncChange,
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
        Bubu time
        <select value={timeZoneMode} onChange={(event) => onTimeZoneModeChange(event.target.value as TimeZoneMode)}>
          <option value="south-africa">South Africa time</option>
          <option value="china">China time</option>
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
      <label className="settings-check">
        <input
          type="checkbox"
          checked={autostartEnabled}
          disabled={autostartPending}
          onChange={(event) => onAutostartChange(event.target.checked)}
        />
        <span>Start Bubu when Windows starts</span>
      </label>
      <label className="settings-check">
        <input
          type="checkbox"
          checked={inputSyncEnabled}
          onChange={(event) => onInputSyncChange(event.target.checked)}
        />
        <span>Global input sync animation</span>
      </label>
    </section>
  );
}
