# 布布桌面宠物 MVP

这是一个第一版桌面宠物程序，使用 Tauri + React + TypeScript 实现。宠物会显示在桌面透明悬浮窗口里，可以播放动画、点击互动、拖动、右键操作、打开聊天框，并用系统 TTS 朗读回复。

当前默认宠物是 `bubu`。

## 运行方式

第一次运行前，请确认已经安装：

- Node.js
- Rust / Cargo
- Windows WebView2 Runtime

在项目目录运行：

```powershell
cd C:\Users\yedou\Documents\Digital_Pet
npm.cmd install
npm.cmd run tauri:dev
```

DeepSeek API Key 默认从项目根目录的 `.env.local` 读取：

```text
VITE_DEEPSEEK_API_KEY=your_deepseek_key_here
VITE_DEEPSEEK_MODEL=deepseek-v4-flash
```

`.env.local` 不会提交到 GitHub。给别人代码时，请给 `.env.example`，让对方在自己的电脑上复制成 `.env.local` 并填入自己的 Key。

如果只想预览前端页面：

```powershell
npm.cmd run dev
```

然后打开：

```text
http://127.0.0.1:1420
```

桌面透明窗口、托盘、隐藏、退出等能力需要用 `npm.cmd run tauri:dev`。

## 基本操作

- 单击宠物：宠物进入开心状态并显示一句话。
- 双击宠物：打开聊天框。
- 输入文字并发送：宠物先思考，然后回复并朗读。
- 按住宠物拖动：移动宠物位置，松开后保存位置。
- 右键宠物：打开菜单。
- 长时间不操作：宠物进入睡觉状态。
- 睡觉时点击：唤醒宠物。

右键菜单包含：

- 打开聊天
- 换一句话
- 隐藏宠物
- 设置
- 退出

## 状态说明

宠物内部有一个统一的状态机。所有互动都会先变成事件，再由状态机决定进入哪个状态。

主要状态：

```text
idle   待机
happy  开心
sleep  睡觉
think  思考
talk   说话
drag   被拖动
menu   右键菜单打开
hidden 隐藏
```

常见流程：

```text
单击宠物
idle -> happy -> idle
```

```text
发送聊天
idle -> think -> talk -> idle
```

```text
拖动宠物
idle -> drag -> idle
```

```text
长时间不操作
idle -> sleep
```

这样做的好处是：状态切换集中在一个地方，不会散落在各个组件里。后续要加新动作，只需要加状态、事件和对应动画。

状态机文件：

```text
src/renderer/pet/petStateMachine.ts
```

## 本地回复和 DeepSeek

当前聊天有两个模式：

```text
local 本地回复
ai    DeepSeek
```

默认模式是 `ai`。程序启动后会自动测试一次 DeepSeek：

- 测试成功：保持 DeepSeek 模式。
- 测试失败或没有 API Key：自动切换到本地回复模式。

`local` 是当前真正可用的模式。它不联网，也不调用大模型，只是根据用户输入做简单规则匹配。例如：

- 输入包含“你好”，回复“你好呀，我一直在桌面陪着你！”
- 输入包含“累”，回复“那就休息一下吧，喝点水，伸个懒腰。”
- 输入包含“你是谁”，回复“我是你的桌面小宠物，也是你的电脑陪伴助手。”

对应代码：

```text
src/renderer/services/localReplyService.ts
```

`ai` 是 DeepSeek 模式。API Key 优先从 `.env.local` 读取，也可以在右键菜单的“Settings”里临时填写。保存后发送消息，宠物会请求 DeepSeek 接口生成回复。

如果没有填写 API Key，或者 DeepSeek 请求失败，程序会自动退回本地回复，保证宠物不会卡住。

当前 DeepSeek 调用在这里：

```text
src/renderer/services/chatService.ts
```

当前默认模型是：

```text
deepseek-v4-flash
```

调用流程：

```text
用户输入 -> chatService 判断 mode -> local 走本地规则 -> ai 调用 DeepSeek -> 返回文本 -> 气泡显示 -> TTS 朗读
```

## 素材目录

当前使用的宠物配置在：

```text
assets/pets/bubu/pet.json
```

动作帧目录：

```text
assets/pets/bubu/idle/
assets/pets/bubu/happy/
assets/pets/bubu/think/
assets/pets/bubu/sleep/
assets/pets/bubu/talk/
assets/pets/bubu/drag/
```

每个动作目录里是 6 张 PNG 帧，例如：

```text
idle_00.png
idle_01.png
idle_02.png
idle_03.png
idle_04.png
idle_05.png
```

## 从 6 张大图生成动作帧

原图规则：

```text
6 张原图
每张原图对应 1 个动作
每张原图内部是 3 列 x 2 行
每张原图切出 6 帧
```

对应关系：

```text
第 1 张 -> idle
第 2 张 -> happy
第 3 张 -> think
第 4 张 -> sleep
第 5 张 -> talk
第 6 张 -> drag
```

把 6 张原图放到：

```text
assets/source-sheets/bubu/
```

文件名需要是：

```text
a_clean_digital_illustration_sprite_sheet_style_1.png
a_clean_illustration_comic_style_sprite_sheet_a_t_2_batch_1.png
a_clean_flat_vector_sprite_sheet_sticker_shee_3_batch_2.png
a_clean_png_style_illustration_on_a_transparent_ch_4_batch_3.png
a_clean_flat_digital_illustration_sprite_sheet_5_batch_4.png
a_clean_cute_sticker_sheet_style_illustration_6_batch_5.png
```

然后运行：

```powershell
npm.cmd run slice:bubu
```

脚本会按 3x2 网格裁剪、去掉边缘背景、统一输出为 256x256 PNG 帧。

## 动画播放顺序

播放顺序在 `assets/pets/bubu/pet.json` 里配置。

例如 idle：

```json
"sequence": [0, 1, 2, 1, 0, 3, 0]
```

这表示待机时不会简单地从 0 播到 5，而是按更自然的节奏循环。

## 常见问题

### 桌面上出现了两个宠物

通常是运行了两次 `npm.cmd run tauri:dev`，旧窗口还没有退出。

处理方式：

1. 在运行窗口按 `Ctrl + C`
2. 对残留宠物右键，点击“退出”
3. 再重新运行一次：

```powershell
npm.cmd run tauri:dev
```

### 提示找不到 cargo

说明没有安装 Rust，或者安装后 PowerShell 没刷新。

先检查：

```powershell
cargo --version
rustc --version
```

如果找不到命令，安装 Rust：

```text
https://rustup.rs
```

安装完成后重新打开 PowerShell。

### 提示缺少 icon.ico

项目已经包含：

```text
src-tauri/icons/icon.ico
```

如果这个文件被删除，Tauri 在 Windows 下会构建失败。

### 为什么拖动时不像全屏画布

桌面宠物不是直接画在整个桌面上的，它本质上是一个透明小窗口。拖动时移动的是这个窗口。

当前版本使用手动移动窗口，不会出现系统原生拖动时的窗口边框反馈。为了容纳气泡、菜单和聊天框，窗口仍然会比宠物本体略大一点。后续如果要做到宠物本体几乎完全贴边，可以把“宠物本体”和“聊天/菜单 UI”拆成两个窗口。

## 安装到别人的电脑

最方便的方式是打包安装包，而不是让对方安装开发环境。

开发者电脑上运行：

```powershell
cd C:\Users\yedou\Documents\Digital_Pet
npm.cmd run tauri:build
```

构建完成后，在下面目录找安装包：

```text
src-tauri/target/release/bundle/
```

通常 Windows 会生成 `.msi` 或 `.exe` 安装包。把这个安装包发给别人，对方双击安装即可。

注意：

- 如果要让别人使用 DeepSeek，不建议把你的 API Key 打进安装包里。
- 更安全的做法是让每个人在设置里填自己的 Key。
- 如果只是体验宠物动画和本地回复，不需要 DeepSeek Key。

如果你想让别人直接从 GitHub 更新代码，需要对方安装 Node.js、Rust、WebView2，然后 clone 仓库并运行：

```powershell
npm.cmd install
npm.cmd run tauri:dev
```

## 项目结构

```text
src/renderer/App.tsx
src/renderer/components/Pet.tsx
src/renderer/components/SpeechBubble.tsx
src/renderer/components/ChatBox.tsx
src/renderer/components/ContextMenu.tsx
src/renderer/components/SettingsPanel.tsx
src/renderer/pet/petStateMachine.ts
src/renderer/pet/animationPlayer.ts
src/renderer/services/chatService.ts
src/renderer/services/ttsService.ts
assets/pets/bubu/pet.json
scripts/slice-bubu-sheets.mjs
```

## 当前范围

已经实现：

- 透明置顶桌面窗口
- 帧动画播放
- 单击、双击、拖动、右键菜单
- 聊天框
- 本地回复
- DeepSeek API Key 设置
- DeepSeek 聊天调用和本地兜底
- 气泡
- TTS 朗读
- 睡觉机制
- 隐藏和退出
- 3x2 原图裁剪成动作帧

暂未实现：

- 成长系统
- 商城
- 插件系统
- 多宠物联动
