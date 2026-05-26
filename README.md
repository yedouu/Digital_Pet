# Bubu 桌面宠物使用说明

Bubu 是一个会停在桌面上的小宠物。它可以显示动画、拖动位置、聊天、朗读回复，并根据时间切换不同状态。

## 快速开始

普通用户建议从 GitHub Releases 下载最新版安装包：

[GitHub Releases](https://github.com/yedouu/Digital_Pet/releases)

下载后运行安装包，安装完成后打开 `Bubu Desktop Pet` 即可。

如果你是从源码运行：

```powershell
npm.cmd install
npm.cmd run tauri:dev
```

## 基本操作

- 单击 Bubu：播放开心反应，并显示一句小气泡。
- 双击 Bubu：打开聊天框。
- 拖动 Bubu：按住宠物移动到桌面任意位置，松开后会保存位置。
- 右键 Bubu：打开菜单。
- 长时间不操作：Bubu 会根据当前选择的时区和时间自动切换待机状态。

## 右键菜单

右键 Bubu 后可以使用这些功能：

- `Chat`：打开聊天框。
- `Random line`：让 Bubu 换一句话。
- `Hide`：隐藏 Bubu。
- `Settings`：打开设置。
- `Exit`：退出程序。

隐藏后可以通过系统托盘图标重新显示 Bubu。

## 聊天与朗读

双击 Bubu 打开聊天框后，可以输入文字并按 Enter 或点击发送。

Bubu 会先思考，然后显示回复气泡，并用英文 TTS 朗读。回复气泡不会立刻消失，可以手动关闭。

目前支持两种聊天模式：

- `DeepSeek API`：使用 DeepSeek 接口回复。
- `Local fallback`：本地兜底回复，不需要联网，但回答比较简单。

如果 DeepSeek 不可用，程序会自动切换到本地兜底模式。

## 设置说明

打开右键菜单，点击 `Settings` 可以进入设置。

### Chat mode

选择聊天模式：

- `DeepSeek API`
- `Local fallback`

### Bubu time

选择 Bubu 使用哪个时区判断状态：

- `South Africa time`
- `China time`

Bubu 会按所选时区切换待机状态：

- `06:00-08:00`：刚睡醒
- `08:00-22:00`：精神饱满
- `22:00-06:00`：困困的

### DeepSeek API Key

可以在设置里填写 DeepSeek API Key，也可以在项目根目录创建 `.env.local`：

```text
VITE_DEEPSEEK_API_KEY=your_deepseek_key_here
VITE_DEEPSEEK_MODEL=deepseek-v4-flash
```

`.env.local` 不会提交到 Git。

### Start Bubu when Windows starts

控制是否开机自启动。默认关闭。

## 给别人安装

如果要把 Bubu 安装到别人的电脑，推荐发布安装包，而不是让对方运行源码。

开发者构建安装包：

```powershell
npm.cmd run tauri:build
```

生成位置：

```text
src-tauri/target/release/bundle/
```

把里面的 `.msi` 或 `.exe` 发给用户安装即可。

## 更新方式

当前推荐使用 GitHub Release 手动更新：

1. 开发者构建新版安装包。
2. 上传到 GitHub Releases。
3. 用户下载新版安装包。
4. 用户直接运行新版安装包覆盖安装。

通常不需要先卸载旧版本。只要应用的 `identifier` 和 `productName` 保持一致，并递增版本号，安装包会识别为同一个应用的新版本。

## 开发者常用命令

启动开发版：

```powershell
npm.cmd run tauri:dev
```

构建前端：

```powershell
npm.cmd run build
```

构建安装包：

```powershell
npm.cmd run tauri:build
```

## 当前版本说明

当前稳定分支使用 Sprite 图片动画方案。Live2D 方案在独立分支中验证，不包含在当前稳定版本里。
