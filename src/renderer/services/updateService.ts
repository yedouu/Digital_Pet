import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

export type UpdateStatusType = "info" | "progress" | "success" | "error";

export interface UpdateStatus {
  type: UpdateStatusType;
  message: string;
}

export async function checkForAppUpdate(onStatus: (status: UpdateStatus) => void): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  let update;

  try {
    update = await check({ timeout: 15000 });
  } catch (error) {
    console.info("Update check failed:", error);
    return;
  }

  if (!update) {
    return;
  }

  const notes = update.body ? `\n\n${update.body}` : "";
  const shouldInstall = window.confirm(`Bubu ${update.version} is available. Download and install it now?${notes}`);

  if (!shouldInstall) {
    onStatus({
      type: "info",
      message: `Update ${update.version} is available.`
    });
    return;
  }

  let downloaded = 0;
  let contentLength = 0;

  onStatus({
    type: "info",
    message: `Downloading Bubu ${update.version}...`
  });

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        contentLength = event.data.contentLength ?? 0;
        downloaded = 0;
        onStatus({
          type: "progress",
          message: "Starting update download..."
        });
        break;

      case "Progress":
        downloaded += event.data.chunkLength;
        onStatus({
          type: "progress",
          message: formatDownloadProgress(downloaded, contentLength)
        });
        break;

      case "Finished":
        onStatus({
          type: "success",
          message: "Update downloaded. Installing now..."
        });
        break;
    }
  });

  onStatus({
    type: "success",
    message: "Update installed. Restarting Bubu..."
  });

  await relaunch();
}

function formatDownloadProgress(downloaded: number, contentLength: number): string {
  if (!contentLength) {
    return "Downloading update...";
  }

  const percent = Math.min(100, Math.round((downloaded / contentLength) * 100));
  return `Downloading update... ${percent}%`;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
