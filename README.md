# Bubu 桌面宠物使用说明

Bubu 是一个会停在桌面上的小熊宠物。它可以播放动画、拖动位置、聊天、朗读回复，并根据时间切换不同待机状态。

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

右键菜单支持聊天、换一句话、隐藏、设置和退出。隐藏后可以通过系统托盘图标重新显示 Bubu。

## 聊天与朗读

双击 Bubu 打开聊天框后，可以输入文字并按 `Enter` 或点击发送。

Bubu 会先进入思考状态，然后显示回复气泡，并用 TTS 朗读。回复气泡不会立刻消失，可以手动关闭。

目前支持两种聊天模式：

- `DeepSeek API`：使用 DeepSeek 接口回复。
- `Local fallback`：本地兜底回复，不需要联网，回答会比较简单。

如果 DeepSeek 不可用，程序会自动切换到本地兜底模式。

## 布布角色系统

现在 Bubu 已经不是普通问答助手，而是带角色设定的桌面小熊。

Bubu 的设定是：圆滚滚的棕色小熊，脸颊有黄色腮红，语气温柔、可爱、陪伴感强，会鼓励用户、提醒休息，也会轻轻撒娇。

AI 回复会返回结构化结果，例如：

```json
{
  "action": "happy",
  "emotion": "caring",
  "text": "辛苦啦，布布抱抱你，先休息一下下~"
}
```

程序会根据 `action` 控制动画：

- `happy`：先播放开心动作，再说话。
- `think`：先播放思考动作，再说话。
- `talk`：直接说话。
- `sleep`：说完后进入睡觉状态。
- `idle`：保持普通状态。

Bubu 还会保存最近几轮聊天作为短期记忆，让对话更连贯。第一次启动时，Bubu 会播放专属欢迎语。

## 角色卡怎么使用和修改

角色卡主要写在：

```text
src/renderer/ai/bubuCharacter.ts
```

如果想修改 Bubu 的性格、说话方式、口头禅、边界规则或示例对话，优先改这个文件。

常见可改内容：

- `personality`：控制 Bubu 的性格，比如温柔、活泼、黏人。
- `relationship`：控制 Bubu 和用户的关系设定。
- `speechStyle`：控制回复风格，比如简短、可爱、不要 Markdown。
- `catchphrases`：控制常用口头禅。
- `boundaries`：控制不能说什么、不能做什么。
- `exampleDialogues`：给 AI 示例对话，用来稳定 Bubu 的语气和动作选择。

AI 的输出格式规则写在：

```text
src/renderer/ai/promptBuilder.ts
```

如果想调整 AI 必须返回哪些字段、每次回复多长、动作选择规则，就改这里。

AI 返回结果的兜底解析写在：

```text
src/renderer/ai/replyParser.ts
```

如果 AI 偶尔没有按 JSON 返回，这里会尽量提取 JSON，并把非法的 `action` / `emotion` 自动换成安全默认值。

短期记忆保存在浏览器本地存储里，逻辑在：

```text
src/renderer/ai/memoryService.ts
```

目前记忆只保存最近几轮聊天，不会上传到仓库。想重置记忆，可以清空应用的本地数据。

首次启动欢迎语写在：

```text
src/renderer/ai/giftConfig.ts
```

如果要把 Bubu 改成更私人化的礼物，可以从这里修改欢迎语、称呼和祝福语。

修改角色卡后，建议先运行：

```powershell
npm.cmd run build
```

构建通过后再运行：

```powershell
npm.cmd run tauri:dev
```

这样可以先确认类型没有写错，再实际测试 Bubu 的回复效果。

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
VITE_DEEPSEEK_MODEL=deepseek-chat
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
