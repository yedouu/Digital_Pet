import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";

export type UpdateStatusType = "info" | "progress" | "success" | "error";

export interface UpdateStatus {
  type: UpdateStatusType;
  message: string;
}

export interface AppUpdateInfo {
  currentVersion: string;
  version: string;
  date?: string;
  body?: string;
}

let availableUpdate: Update | null = null;

export async function checkForAvailableUpdate(): Promise<AppUpdateInfo | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  try {
    const update = await check({ timeout: 15000 });

    if (!update) {
      availableUpdate = null;
      return null;
    }

    availableUpdate = update;

    return {
      currentVersion: update.currentVersion,
      version: update.version,
      date: update.date,
      body: update.body
    };
  } catch (error) {
    console.info("Update check failed:", error);
    throw new Error("Update check failed. Please check the GitHub Release files.");
  }
}

export async function installAvailableUpdate(onStatus: (status: UpdateStatus) => void): Promise<void> {
  if (!availableUpdate) {
    throw new Error("No update is ready to install.");
  }

  const update = availableUpdate;

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
