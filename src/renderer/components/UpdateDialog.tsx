import type { AppUpdateInfo, UpdateStatus } from "../services/updateService";

let currentWindowPromise: Promise<{ startDragging: () => Promise<void> } | null> | null = null;

function getCurrentAppWindow() {
  if (!("__TAURI_INTERNALS__" in window)) {
    return Promise.resolve(null);
  }

  currentWindowPromise = currentWindowPromise ?? import("@tauri-apps/api/window")
    .then((api) => api.getCurrentWindow())
    .catch(() => null);

  return currentWindowPromise;
}

interface UpdateDialogProps {
  open: boolean;
  updateInfo: AppUpdateInfo | null;
  status: UpdateStatus | null;
  installing: boolean;
  onInstall: () => void;
  onClose: () => void;
}

export default function UpdateDialog({
  open,
  updateInfo,
  status,
  installing,
  onInstall,
  onClose
}: UpdateDialogProps) {
  if (!open || !updateInfo) {
    return null;
  }

  async function handleDragStart() {
    const appWindow = await getCurrentAppWindow();
    await appWindow?.startDragging();
  }

  return (
    <section className="update-dialog" aria-label="Update available">
      <div className="update-card">
        <header className="update-header" onPointerDown={handleDragStart}>
          <div>
            <strong>Bubu {updateInfo.version}</strong>
            <span>Current {updateInfo.currentVersion}</span>
          </div>
          <button
            type="button"
            aria-label="Close update dialog"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
            disabled={installing}
          >
            x
          </button>
        </header>

        <div className="update-notes">{updateInfo.body?.trim() || "No release notes provided."}</div>

        {status ? <div className={`update-status update-status-${status.type}`}>{status.message}</div> : null}

        <div className="update-actions">
          <button type="button" onClick={onClose} disabled={installing}>
            Later
          </button>
          <button type="button" className="update-primary" onClick={onInstall} disabled={installing}>
            {installing ? "Updating..." : "Download"}
          </button>
        </div>
      </div>
    </section>
  );
}
