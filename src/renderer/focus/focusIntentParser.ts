import type { FocusIntent } from "./focusTypes";

export function parseFocusIntent(input: string): FocusIntent | null {
  const text = input.trim();

  if (!text) {
    return null;
  }

  const focusMinutes = matchMinutes(text, /(我要专注|陪我学习|专注|学习|工作)\s*(\d{1,3})\s*分钟/i);

  if (focusMinutes) {
    return { type: "start_focus", minutes: focusMinutes };
  }

  if (/^(开始番茄钟|开始专注|start pomodoro|start focus)$/i.test(text)) {
    return { type: "start_focus", minutes: 25 };
  }

  const breakMinutes = matchMinutes(text, /(休息)\s*(\d{1,3})\s*分钟/i);

  if (breakMinutes) {
    return { type: "start_break", minutes: breakMinutes };
  }

  if (/^(暂停专注|暂停番茄钟|pause focus|pause pomodoro)$/i.test(text)) {
    return { type: "pause" };
  }

  if (/^(继续专注|继续番茄钟|resume focus|resume pomodoro)$/i.test(text)) {
    return { type: "resume" };
  }

  if (/^(取消专注|取消番茄钟|停止专注|cancel focus|cancel pomodoro)$/i.test(text)) {
    return { type: "cancel" };
  }

  if (/^(还有多久|还剩多久|剩多久|how much time left)\??$/i.test(text)) {
    return { type: "query" };
  }

  return null;
}

function matchMinutes(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  const minutes = Number(match?.[2]);
  return Number.isFinite(minutes) && minutes > 0 ? Math.min(minutes, 180) : null;
}
