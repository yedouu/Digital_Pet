import type { TimeZoneMode } from "../pet/petTypes";
import { createTimeContext } from "./timeService";

export function getLocalReply(input: string, timeZoneMode: TimeZoneMode): string {
  const normalized = input.toLowerCase();

  if (normalized.includes("time") || normalized.includes("clock") || input.includes("几点") || input.includes("时间")) {
    return `布布看了一下时间：${createTimeContext(timeZoneMode)}`;
  }

  if (normalized.includes("hello") || normalized.includes("hi") || input.includes("你好")) {
    return "你好呀，布布一直在桌面陪着你~";
  }

  if (normalized.includes("tired") || normalized.includes("sleepy") || input.includes("累")) {
    return "辛苦啦，先喝口水，布布陪你休息一下下。";
  }

  if (normalized.includes("who are you") || input.includes("你是谁")) {
    return "我是布布呀，是专门来陪你的小熊~";
  }

  return "布布听到啦，我会乖乖陪你慢慢说。";
}
