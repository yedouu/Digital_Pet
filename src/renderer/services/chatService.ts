import { appConfig } from "../config/appConfig";
import type { ChatMode } from "../pet/petTypes";
import { getLocalReply } from "./localReplyService";

interface PetReplyOptions {
  deepseekApiKey?: string;
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

export async function getPetReply(input: string, mode: ChatMode, options: PetReplyOptions = {}): Promise<string> {
  if (mode === "ai") {
    const apiKey = options.deepseekApiKey?.trim();

    if (apiKey) {
      try {
        return await getDeepSeekReply(input, apiKey);
      } catch {
        return `DeepSeek is unavailable, so I switched to local mode: ${getLocalReply(input)}`;
      }
    }

    return `No DeepSeek API key is configured, so I switched to local mode: ${getLocalReply(input)}`;
  }

  await new Promise((resolve) => window.setTimeout(resolve, 450));
  return getLocalReply(input);
}

export async function testDeepSeekConnection(apiKey: string): Promise<boolean> {
  if (!apiKey.trim()) {
    return false;
  }

  try {
    await getDeepSeekReply("Reply with only the word OK.", apiKey);
    return true;
  } catch {
    return false;
  }
}

async function getDeepSeekReply(input: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: appConfig.deepseekModel,
        messages: [
          {
            role: "system",
            content:
              "You are a cute desktop pet assistant. Reply in concise, friendly English suitable for a small speech bubble."
          },
          {
            role: "user",
            content: input
          }
        ],
        temperature: 0.8,
        max_tokens: 160,
        stream: false
      }),
      signal: controller.signal
    });

    const data = (await response.json()) as DeepSeekResponse;

    if (!response.ok) {
      throw new Error(data.error?.message ?? "DeepSeek request failed");
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("DeepSeek returned an empty reply");
    }

    return reply;
  } finally {
    window.clearTimeout(timeout);
  }
}
