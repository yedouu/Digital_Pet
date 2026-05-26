import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
const version = packageJson.version;
const repo = process.env.GITHUB_REPOSITORY ?? "yedouu/Digital_Pet";
const releaseTag = process.env.RELEASE_TAG ?? `v${version}`;
const cargoTargetDir = process.env.CARGO_TARGET_DIR ?? "target";
const releaseNotes = process.env.RELEASE_NOTES?.trim() || getDefaultReleaseNotes(version);
const targetDir = path.isAbsolute(cargoTargetDir)
  ? cargoTargetDir
  : path.join(rootDir, "src-tauri", cargoTargetDir);
const bundleDir = path.join(targetDir, "release", "bundle");
const candidates = [
  path.join(bundleDir, "nsis"),
  path.join(bundleDir, "msi")
];

const artifact = findWindowsArtifact(candidates);
const signaturePath = `${artifact.path}.sig`;

if (!existsSync(signaturePath)) {
  throw new Error(`Missing signature file: ${signaturePath}`);
}

const latestJson = {
  version,
  notes: releaseNotes,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: readFileSync(signaturePath, "utf8").trim(),
      url: `https://github.com/${repo}/releases/download/${encodeURIComponent(releaseTag)}/${encodeURIComponent(artifact.fileName)}`
    }
  }
};

const outputPath = path.join(bundleDir, "latest.json");
writeFileSync(outputPath, `${JSON.stringify(latestJson, null, 2)}\n`);
console.log(`Created ${outputPath}`);

function findWindowsArtifact(directories) {
  const versionPattern = new RegExp(`${escapeRegExp(version)}.*\\.(exe|msi)$`, "i");

  for (const directory of directories) {
    if (!existsSync(directory)) {
      continue;
    }

    const installers = readdirSync(directory).filter((file) => file.endsWith(".exe") || file.endsWith(".msi"));
    const fileName = installers.find((file) => versionPattern.test(file));

    if (fileName) {
      return {
        fileName,
        path: path.join(directory, fileName)
      };
    }
  }

  throw new Error(`No Windows installer found for version ${version}. Run npm.cmd run tauri:build first.`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDefaultReleaseNotes(currentVersion) {
  if (currentVersion === "0.1.0" || currentVersion === "0.1.2") {
    return [
      "Bubu Desktop Pet 0.1.2",
      "",
      "- Added a built-in update dialog with release notes.",
      "- Shows download progress before installing updates.",
      "- Fixed update download links for installer names with spaces.",
      "- Release builds no longer open a console window."
    ].join("\n");
  }

  return `Bubu Desktop Pet ${currentVersion}`;
}
