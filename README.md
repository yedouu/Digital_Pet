# Bubu 桌面宠物使用说明

Bubu 是一个透明悬浮在桌面上的小熊宠物。它可以播放动画、拖动位置、聊天、朗读回复、记住用户明确要求记住的信息，也可以陪用户进行番茄钟专注。

## 快速开始

普通用户建议从 GitHub Releases 下载最新安装包：

[GitHub Releases](https://github.com/yedouu/Digital_Pet/releases)

下载安装包后运行安装，安装完成后打开 `Bubu Desktop Pet` 即可。

如果你是从源码运行：

```powershell
npm.cmd install
npm.cmd run tauri:dev
```

## 基本操作

- 单击 Bubu：播放开心反应，专注中会显示短鼓励。
- 双击 Bubu：打开聊天框。
- 拖动 Bubu：移动到桌面任意位置，松开后保存位置。
- 右键 Bubu：打开菜单，可聊天、换句话、隐藏、设置、退出。
- 长时间待机：Bubu 会根据所选时区和时间切换待机表情。

## 聊天、记忆与番茄钟

Bubu 支持 `DeepSeek API` 和 `Local fallback` 两种模式。DeepSeek 不可用时会自动切换到本地兜底回复。

轻量记忆只在用户明确要求时写入，例如：

```text
布布记住 我喜欢晚上学习
记住 我的生日是 5 月 20 日
帮我记住 我不喜欢太长的回复
```

查看和删除记忆：

```text
查看记忆
你记住了什么
删除记忆 晚上学习
```

番茄钟指令示例：

```text
我要专注 25 分钟
陪我学习 30 分钟
开始番茄钟
休息 5 分钟
暂停专注
继续专注
取消专注
还有多久
```

专注中会显示倒计时小组件；时间结束后，Bubu 会提醒休息或回到学习。

## 设置说明

右键 Bubu，点击 `Settings` 可以进入设置。

常用设置：

- Chat mode：选择 `DeepSeek API` 或 `Local fallback`。
- Bubu time：选择 `South Africa time` 或 `China time`。
- DeepSeek API Key：填写 DeepSeek API Key。
- Start Bubu when Windows starts：控制是否开机自启动。
- Reset first greeting：重置首次启动欢迎语，方便测试。

也可以在项目根目录创建 `.env.local`：

```text
VITE_DEEPSEEK_API_KEY=your_deepseek_key_here
VITE_DEEPSEEK_MODEL=deepseek-chat
```

`.env.local` 不会提交到 Git。

## 构建命令分类

### 安装依赖

```powershell
npm.cmd install
```

第一次拉取项目后运行一次。

### 开发运行

```powershell
npm.cmd run tauri:dev
```

启动 Tauri 开发版。适合平时测试功能，不会生成安装包。

只启动前端网页：

```powershell
npm.cmd run dev
```

### 普通构建检查

```powershell
npm.cmd run build
```

执行资源准备、TypeScript 检查和前端生产构建。适合提交前快速确认前端没有类型错误。

Rust/Tauri 侧检查：

```powershell
cd src-tauri
cargo check
cd ..
```

### 正式打包安装包

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY=(Get-Content .tauri\bubu-updater.key -Raw)
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD='bubu-update-local'
npm.cmd run tauri:build -- --bundles nsis
```

生成 Windows NSIS 安装包，并生成自动更新所需的签名文件 `.sig`。

生成位置：

```text
src-tauri/target/release/bundle/nsis/
```

### 生成自动更新文件

```powershell
npm.cmd run release:latest-json
```

生成 Tauri Updater 需要的 `latest.json`。

发布 GitHub Release 时，需要上传：

- `Bubu.Desktop.Pet_x.x.x_x64-setup.exe`
- 对应的 `.sig`
- `latest.json`

### 资源处理命令

```powershell
npm.cmd run prepare-assets
npm.cmd run slice:bubu
npm.cmd run generate:interactions
```

这些命令用于准备和生成宠物动画资源。

## 重点命令解释

### 1. 签名并打包 NSIS 安装包

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY=(Get-Content .tauri\bubu-updater.key -Raw)
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD='bubu-update-local'
npm.cmd run tauri:build -- --bundles nsis
```

第一行：

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY=(Get-Content .tauri\bubu-updater.key -Raw)
```

读取本机的 Tauri 更新签名私钥，并临时写入当前 PowerShell 窗口的环境变量。Tauri 用它给安装包生成更新签名。

第二行：

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD='bubu-update-local'
```

设置私钥密码。这个值只在当前 PowerShell 窗口里生效。

第三行：

```powershell
npm.cmd run tauri:build -- --bundles nsis
```

正式构建 Windows NSIS 安装包。`-- --bundles nsis` 的意思是把参数传给 Tauri CLI，只打包 NSIS 安装器。

注意：

- `.tauri/bubu-updater.key` 是私钥，不要提交到仓库。
- 如果要让自动更新可用，安装包和 `.sig` 必须来自同一次签名构建。
- 上传 Release 时，`latest.json` 里的下载地址必须和安装包文件名完全一致。

### 2. 宠物资源处理命令

```powershell
npm.cmd run prepare-assets
npm.cmd run slice:bubu
npm.cmd run generate:interactions
```

`prepare-assets`：

把项目需要的宠物资源准备到前端可访问的位置。平时 `npm.cmd run build` 和 `npm.cmd run tauri:dev` 会自动先运行它。

`slice:bubu`：

把 Bubu 的大图精灵图按网格切成单帧图片。通常只有换原始动作图、重新裁剪素材时才需要手动运行。

`generate:interactions`：

生成互动相关的动作帧，例如鼠标靠近、连续点击、拖动后放下等互动表情资源。通常只有修改互动素材或重新生成互动动画时才需要运行。

## 自动更新流程

Bubu 使用 Tauri Updater + GitHub Releases。

发布新版本时：

1. 修改项目版本号。
2. 运行签名构建命令生成安装包和 `.sig`。
3. 运行 `npm.cmd run release:latest-json` 生成 `latest.json`。
4. 在 GitHub Release 上传安装包、`.sig` 和 `latest.json`。
5. 用户启动旧版应用后，会自动检测到新版本并提示更新。

## 给别人安装

给普通用户时，不要让对方运行源码。直接把 GitHub Release 里的安装包发给对方即可。

如果对方电脑上已有旧版本，运行新安装包会覆盖安装；自动更新也是下载新版安装包后完成覆盖安装。
