import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PetEvent } from "../pet/petTypes";

type InputSyncKind = "keyboard" | "mouse";

export async function setNativeInputSyncEnabled(enabled: boolean): Promise<void> {
  if (!("__TAURI_INTERNALS__" in window)) {
    return;
  }

  await invoke("set_input_sync_enabled", { enabled });
}

export async function listenNativeInputSync(onEvent: (event: PetEvent) => void): Promise<() => void> {
  if (!("__TAURI_INTERNALS__" in window)) {
    return () => {};
  }

  return listen<InputSyncKind>("input-sync", (event) => {
    if (event.payload === "keyboard") {
      onEvent({ type: "INPUT_SYNC_KEYBOARD" });
      return;
    }

    onEvent({ type: "INPUT_SYNC_MOUSE" });
  });
}
