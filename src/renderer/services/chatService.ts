import { bubuCharacter } from "../ai/bubuCharacter";
import type { PetAIReply, PetCharacter } from "../ai/characterTypes";
import { buildPetSystemPrompt, type RecentMessage } from "../ai/promptBuilder";
import { parsePetAIReply } from "../ai/replyParser";
import { appConfig } from "../config/appConfig";
import type { ChatMode, TimeZoneMode } from "../pet/petTypes";
import { getLocalReply } from "./localReplyService";
import { createTimeContext } from "./timeService";

interface PetReplyOptions {
  deepseekApiKey?: string;
  timeZoneMode?: TimeZoneMode;
  userNickname?: string;
  memorySummary?: string;
  recentMessages?: RecentMessage[];
}

interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export async function getPetReply(input: string, mode: ChatMode, options: PetReplyOptions = {}): Promise<PetAIReply> {
  const timeZoneMode = options.timeZoneMode ?? "south-africa";

  if (mode === "ai") {
    const apiKey = options.deepseekApiKey?.trim();

    if (apiKey) {
      try {
        return await getDeepSeekReply(input, apiKey, timeZoneMode, options);
      } catch {
        return buildLocalFallbackReply(input, timeZoneMode);
      }
    }

    return buildLocalFallbackReply(input, timeZoneMode);
  }

  await new Promise((resolve) => window.setTimeout(resolve, 450));
  return buildLocalFallbackReply(input, timeZoneMode);
}

export async function testDeepSeekConnection(apiKey: string): Promise<boolean> {
  if (!apiKey.trim()) {
    return false;
  }

  try {
    await getDeepSeekReply("Reply with JSON only. Set text to OK.", apiKey, "south-africa", {});
    return true;
  } catch {
    return false;
  }
}

function buildLocalFallbackReply(input: string, timeZoneMode: TimeZoneMode): PetAIReply {
  return {
    action: chooseLocalAction(input),
    emotion: chooseLocalEmotion(input),
    text: getLocalReply(input, timeZoneMode)
  };
}

async function getDeepSeekReply(
  input: string,
  apiKey: string,
  timeZoneMode: TimeZoneMode,
  options: PetReplyOptions
): Promise<PetAIReply> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  const messages = buildMessages(input, bubuCharacter, {
    ...options,
    timeZoneMode
  });

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: appConfig.deepseekModel,
        messages,
        temperature: 0.8,
        max_tokens: 180,
        stream: false
      }),
      signal: controller.signal
    });

    const data = (await response.json()) as DeepSeekResponse;

    if (!response.ok) {
      throw new Error(data.error?.message ?? "DeepSeek request failed");
    }

    const rawReply = data.choices?.[0]?.message?.content?.trim();

    if (!rawReply) {
      throw new Error("DeepSeek returned an empty reply");
    }

    return parsePetAIReply(rawReply);
  } finally {
    window.clearTimeout(timeout);
  }
}

function buildMessages(input: string, character: PetCharacter, options: PetReplyOptions) {
  const systemPrompt = buildPetSystemPrompt({
    character,
    memorySummary: options.memorySummary,
    userNickname: options.userNickname || "dear",
    extraContext: createTimeContext(options.timeZoneMode ?? "south-africa")
  });

  const exampleMessages = character.exampleDialogues.flatMap((item) => [
    {
      role: "user" as const,
      content: item.user
    },
    {
      role: "assistant" as const,
      content: JSON.stringify(item.pet)
    }
  ]);

  const recentMessages = (options.recentMessages ?? []).map((item) => ({
    role: item.role,
    content: item.content
  }));

  return [
    {
      role: "system" as const,
      content: systemPrompt
    },
    ...exampleMessages,
    ...recentMessages,
    {
      role: "user" as const,
      content: input
    }
  ];
}

function chooseLocalAction(input: string): PetAIReply["action"] {
  const normalized = input.toLowerCase();

  if (normalized.includes("good night") || normalized.includes("sleep") || normalized.includes("tired")) {
    return "sleep";
  }

  if (normalized.includes("sad") || normalized.includes("down") || normalized.includes("tough")) {
    return "happy";
  }

  if (normalized.includes("?") || normalized.includes("how") || normalized.includes("why")) {
    return "think";
  }

  return "talk";
}

function chooseLocalEmotion(input: string): PetAIReply["emotion"] {
  const normalized = input.toLowerCase();

  if (normalized.includes("good night") || normalized.includes("sleep") || normalized.includes("tired")) {
    return "sleepy";
  }

  if (normalized.includes("sad") || normalized.includes("down") || normalized.includes("tough")) {
    return "caring";
  }

  if (normalized.includes("hello") || normalized.includes("hi")) {
    return "happy";
  }

  return "neutral";
}
