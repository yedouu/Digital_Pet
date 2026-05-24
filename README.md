# Bubu 桌面宠物

Bubu 是一个基于 Tauri 的桌面宠物。它可以悬浮在桌面上，播放帧动画，支持点击反应、拖动、右键菜单、简单聊天、DeepSeek 回复、本地兜底回复和英文 TTS 朗读。

## 使用应用

普通用户建议直接从 GitHub Releases 下载最新版安装包：

[GitHub Releases](https://github.com/yedouu/Digital_Pet/releases)

安装后可以这样使用：

- 单击 Bubu：播放开心反应。
- 双击 Bubu：打开聊天框。
- 右键 Bubu：打开菜单。
- 拖动 Bubu：移动桌面位置。
- 在 Settings 中选择 DeepSeek API 或本地兜底模式。

## 开发运行

请先安装：

- Node.js
- Rust / Cargo
- Windows WebView2 Runtime

然后运行：

```powershell
cd C:\Users\yedou\Documents\Digital_Pet
npm.cmd install
npm.cmd run tauri:dev
```

DeepSeek 配置从 `.env.local` 读取：

```text
VITE_DEEPSEEK_API_KEY=your_deepseek_key_here
VITE_DEEPSEEK_MODEL=deepseek-v4-flash
```

`.env.local` 不会提交到 Git。可以复制 `.env.example` 作为模板。

## 打包安装包

如果要给别的电脑安装，运行：

```powershell
cd C:\Users\yedou\Documents\Digital_Pet
npm.cmd run tauri:build
```

安装包会生成在：

```text
src-tauri/target/release/bundle/
```

Windows 下使用该目录中的 `.msi` 或 `.exe` 安装包。

## 发布和更新用户

当前项目采用简单的手动更新流程：

```text
GitHub Release 上传安装包
用户下载最新版安装包
用户运行安装包升级或覆盖旧版本
```

推荐发布步骤：

1. 修改 `src-tauri/tauri.conf.json` 中的版本号。
2. 构建安装包：

```powershell
npm.cmd run tauri:build
```

3. 打开 GitHub 仓库。
4. 进入 `Releases`。
5. 点击 `Draft a new release`。
6. 创建类似 `v0.1.1` 的 tag。
7. 上传 `src-tauri/target/release/bundle/` 中新的 `.msi` 或 `.exe`。
8. 发布 Release。

用户之后下载新安装包并运行即可更新。

## 新安装包会卸载旧版本吗？

通常不需要手动卸载旧版本。

Windows 安装包主要依赖这些字段识别同一个应用：

```json
{
  "productName": "Bubu Desktop Pet",
  "identifier": "com.codex.desktop-pet-mvp",
  "version": "0.1.1"
}
```

这些字段保持稳定：

- `identifier`
- `productName`
- 安装目标

每次发布递增：

- `version`

当 `identifier` 不变且 `version` 递增时，新安装包会被识别为同一个应用的新版本。运行新安装包通常会升级或覆盖旧文件。

这比先卸载再安装更好，因为卸载可能会删除用户数据，例如窗口位置、设置或 API Key。

## 日常开发流程

每次修改代码后：

```powershell
npm.cmd run build
git add .
git commit -m "Describe the change"
git push
```

公开发布时：

```powershell
# 先更新版本号
npm.cmd run tauri:build
# 再把安装包上传到 GitHub Releases
```

## DeepSeek 和本地兜底

默认模式是 DeepSeek API。

应用启动时会测试一次 DeepSeek：

- 如果测试成功，保持 DeepSeek 模式。
- 如果测试失败或没有 API Key，切换到本地兜底模式。

本地兜底可以离线工作，只返回简单的规则回复。

## 素材说明

Bubu 动画帧存放在：

```text
assets/pets/bubu/
```

如果有 6 张 3x2 精灵图，请放到：

```text
assets/source-sheets/bubu/
```

然后切分为动作帧：

```powershell
npm.cmd run slice:bubu
```
