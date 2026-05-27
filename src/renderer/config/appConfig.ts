export const appConfig = {
  defaultChatMode: "ai",
  deepseekApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY ?? "",
  deepseekModel: import.meta.env.VITE_DEEPSEEK_MODEL ?? "deepseek-chat",
  features: {
    memorySystem: true,
    focusTimer: true,
    focusChatCommands: false,
    updater: true,
    firstLaunchGreeting: true,
    mouseInteractionEffects: true
  }
} as const;
