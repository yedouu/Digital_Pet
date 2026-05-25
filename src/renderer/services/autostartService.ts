import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

export async function getAutostartEnabled(): Promise<boolean> {
  if (!("__TAURI_INTERNALS__" in window)) {
    return false;
  }

  return isEnabled();
}

export async function setAutostartEnabled(enabled: boolean): Promise<boolean> {
  if (!("__TAURI_INTERNALS__" in window)) {
    return false;
  }

  if (enabled) {
    await enable();
  } else {
    await disable();
  }

  return isEnabled();
}
