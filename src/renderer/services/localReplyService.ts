import type { TimeZoneMode } from "../pet/petTypes";
import { createTimeContext } from "./timeService";

export function getLocalReply(input: string, timeZoneMode: TimeZoneMode): string {
  const normalized = input.toLowerCase();

  if (normalized.includes("time") || normalized.includes("clock") || normalized.includes("几点") || normalized.includes("时间")) {
    return createTimeContext(timeZoneMode);
  }

  if (normalized.includes("hello") || normalized.includes("hi")) {
    return "Hello! I'm right here on your desktop.";
  }

  if (normalized.includes("tired") || normalized.includes("sleepy")) {
    return "Take a short break, drink some water, and stretch a little.";
  }

  if (normalized.includes("who are you")) {
    return "I'm your tiny desktop pet and computer companion.";
  }

  return "I heard you. I'm still learning how to answer more cleverly.";
}
