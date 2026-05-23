export function getLocalReply(input: string): string {
  const normalized = input.toLowerCase();

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
