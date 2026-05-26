import type { TimeZoneMode } from "../pet/petTypes";
import { createTimeContext } from "./timeService";

export function getLocalReply(input: string, timeZoneMode: TimeZoneMode): string {
  const normalized = input.toLowerCase();

  if (normalized.includes("time") || normalized.includes("clock") || input.includes("几点") || input.includes("时间")) {
    return `Bubu checked the clock: ${createTimeContext(timeZoneMode)}`;
  }

  if (normalized.includes("hello") || normalized.includes("hi") || input.includes("你好")) {
    return "Hi, Bubu is right here on your desktop.";
  }

  if (normalized.includes("tired") || normalized.includes("sleepy") || input.includes("累")) {
    return "You worked hard. Drink some water and take a tiny break.";
  }

  if (normalized.includes("who are you") || input.includes("你是谁")) {
    return "I'm Bubu, your tiny desktop bear companion.";
  }

  return "Bubu heard you. I'll stay here and listen.";
}
