import type { TimeIdleState, TimeZoneMode } from "../pet/petTypes";

interface BubuTimeInfo {
  utcText: string;
  localText: string;
  hour: number;
  zoneLabel: string;
}

const zoneMap: Record<TimeZoneMode, { timeZone: string; label: string }> = {
  "south-africa": {
    timeZone: "Africa/Johannesburg",
    label: "South Africa time"
  },
  china: {
    timeZone: "Asia/Shanghai",
    label: "China time"
  }
};

export function getBubuTimeInfo(mode: TimeZoneMode, now = new Date()): BubuTimeInfo {
  const zone = zoneMap[mode];
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone.timeZone,
      hour: "2-digit",
      hour12: false,
      hourCycle: "h23"
    }).format(now)
  );

  return {
    utcText: formatDateTime(now, "UTC"),
    localText: formatDateTime(now, zone.timeZone),
    hour,
    zoneLabel: zone.label
  };
}

export function getTimeIdleState(mode: TimeZoneMode, now = new Date()): TimeIdleState {
  const { hour } = getBubuTimeInfo(mode, now);

  if (hour >= 22 || hour < 6) {
    return "sleepy";
  }

  if (hour >= 6 && hour < 8) {
    return "wakeup";
  }

  return "energetic";
}

export function createTimeContext(mode: TimeZoneMode): string {
  const time = getBubuTimeInfo(mode);
  return `Current UTC time: ${time.utcText}. Current ${time.zoneLabel}: ${time.localText}.`;
}

function formatDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}
