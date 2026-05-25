import bubuConfig from "../../../assets/pets/bubu/pet.json";
import type { PetConfig } from "./petTypes";

export const defaultPetConfig = bubuConfig as PetConfig;

export const clickReplies = [
  "Hey!",
  "Boop received.",
  "I'm here.",
  "You've got this today.",
  "Head pats are accepted in moderation."
];

export const randomReplies = [
  "Desk patrol complete. Everything looks fine.",
  "Remember to drink some water.",
  "Tiny break suggestion: stretch your shoulders.",
  "I'm staying right here with you.",
  "When stuck, start with the smallest next step."
];

export const interactionEffects = {
  lookAtMouse: true,
  fastMoveStartle: false,
  clickChainAnnoyed: true,
  dropWobble: true,
  hoverShy: true
} as const;

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
