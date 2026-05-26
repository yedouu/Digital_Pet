import type { PetAIReply, PetAction, PetEmotion } from "./characterTypes";

const validActions: PetAction[] = ["idle", "happy", "think", "talk", "sleep"];

const validEmotions: PetEmotion[] = ["neutral", "happy", "shy", "caring", "thinking", "sleepy", "surprised", "sad"];

export function parsePetAIReply(raw: string): PetAIReply {
  try {
    const jsonText = extractJson(raw);
    const data = JSON.parse(jsonText);

    const action: PetAction = validActions.includes(data.action) ? data.action : "talk";
    const emotion: PetEmotion = validEmotions.includes(data.emotion) ? data.emotion : "neutral";
    const text = typeof data.text === "string" && data.text.trim() ? data.text.trim() : "Bubu is here.";

    return {
      action,
      emotion,
      text: truncateText(text, 120)
    };
  } catch {
    return {
      action: "talk",
      emotion: "neutral",
      text: truncateText(raw || "Bubu is here.", 120)
    };
  }
}

function extractJson(raw: string): string {
  const text = raw.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
