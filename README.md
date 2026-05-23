# Bubu Desktop Pet

Bubu is a small desktop pet built with Tauri. It floats on the desktop, plays frame animations, supports click reactions, dragging, right-click actions, simple chat, DeepSeek replies, local fallback replies, and English TTS.

## Use The App

For normal users, download the latest installer from GitHub Releases and install it:

[GitHub Releases](https://github.com/yedouu/Digital_Pet/releases)

After installation:

- Single click Bubu: play a happy reaction.
- Double click Bubu: open chat.
- Right click Bubu: open menu.
- Drag Bubu: move it around the desktop.
- Use Settings to choose DeepSeek API or local fallback.

## Run For Development

Install these first:

- Node.js
- Rust / Cargo
- Windows WebView2 Runtime

Then run:

```powershell
cd C:\Users\yedou\Documents\Digital_Pet
npm.cmd install
npm.cmd run tauri:dev
```

DeepSeek config is read from `.env.local`:

```text
VITE_DEEPSEEK_API_KEY=your_deepseek_key_here
VITE_DEEPSEEK_MODEL=deepseek-v4-flash
```

`.env.local` is ignored by Git. Use `.env.example` as the template.

## Build An Installer

To package the app for other computers:

```powershell
cd C:\Users\yedou\Documents\Digital_Pet
npm.cmd run tauri:build
```

The installer will be generated under:

```text
src-tauri/target/release/bundle/
```

On Windows, use the `.msi` or `.exe` installer from that folder.

## Release And Update Users

This project currently uses a simple manual update flow:

```text
GitHub Release uploads installer
Users download the newest installer
Users run it to upgrade/overwrite the old version
```

Recommended release steps:

1. Update the version in `src-tauri/tauri.conf.json`.
2. Build the installer:

```powershell
npm.cmd run tauri:build
```

3. Open the GitHub repository.
4. Go to `Releases`.
5. Click `Draft a new release`.
6. Create a tag like `v0.1.1`.
7. Upload the new `.msi` or `.exe` from `src-tauri/target/release/bundle/`.
8. Publish the release.

Users then download the new installer and run it.

## Does The New Installer Remove The Old Version?

Usually you do not need to manually uninstall the old version.

For Windows installers, the important fields are:

```json
{
  "productName": "Bubu Desktop Pet",
  "identifier": "com.codex.desktop-pet-mvp",
  "version": "0.1.1"
}
```

Keep these stable:

- `identifier`
- `productName`
- install target

Increase this every release:

- `version`

When the identifier stays the same and the version increases, the installer is treated as the same app's newer version. Running the new installer should upgrade or overwrite the old app files.

This is better than uninstalling first, because uninstalling may remove user data such as saved position, settings, or API key.

## Daily Development Workflow

For every code change:

```powershell
npm.cmd run build
git add .
git commit -m "Describe the change"
git push
```

For a public release:

```powershell
# update version first
npm.cmd run tauri:build
# upload installer to GitHub Releases
```

## DeepSeek And Local Fallback

Default mode is DeepSeek API.

On startup, the app tests DeepSeek once:

- If the test succeeds, it keeps DeepSeek mode.
- If the test fails or no API key exists, it switches to local fallback mode.

Local fallback works offline and only returns simple rule-based replies.

## Asset Notes

Bubu animation frames are stored in:

```text
assets/pets/bubu/
```

If you have six 3x2 sprite sheets, put them in:

```text
assets/source-sheets/bubu/
```

Then slice them into frames:

```powershell
npm.cmd run slice:bubu
```
