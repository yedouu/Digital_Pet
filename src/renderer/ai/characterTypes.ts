export type PetAction = "idle" | "happy" | "think" | "talk" | "sleep";

export type PetEmotion =
  | "neutral"
  | "happy"
  | "shy"
  | "caring"
  | "thinking"
  | "sleepy"
  | "surprised"
  | "sad";

export interface PetCharacter {
  name: string;
  species: string;
  appearance: string;
  personality: string[];
  relationship: string;
  likes: string[];
  dislikes: string[];
  speechStyle: string[];
  catchphrases: string[];
  boundaries: string[];
  exampleDialogues: Array<{
    user: string;
    pet: PetAIReply;
  }>;
}

export interface PetAIReply {
  action: PetAction;
  emotion: PetEmotion;
  text: string;
}
