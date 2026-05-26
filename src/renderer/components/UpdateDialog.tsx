import type { AppUpdateInfo, UpdateStatus } from "../services/updateService";

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

  return (
    <section className="update-dialog" aria-label="Update available">
      <div className="update-card">
        <header className="update-header">
          <div>
            <strong>Bubu {updateInfo.version}</strong>
            <span>Current {updateInfo.currentVersion}</span>
          </div>
          <button type="button" aria-label="Close update dialog" onClick={onClose} disabled={installing}>
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
