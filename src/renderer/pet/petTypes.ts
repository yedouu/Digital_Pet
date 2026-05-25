export type PetState =
  | "idle"
  | "happy"
  | "sleep"
  | "think"
  | "talk"
  | "drag"
  | "look"
  | "annoyed"
  | "drop"
  | "shy"
  | "menu"
  | "hidden";

export type PetEvent =
  | { type: "APP_START" }
  | { type: "CLICK" }
  | { type: "DOUBLE_CLICK" }
  | { type: "RIGHT_CLICK" }
  | { type: "MENU_CLOSE" }
  | { type: "DRAG_START" }
  | { type: "DRAG_END" }
  | { type: "MOUSE_NEAR" }
  | { type: "MOUSE_LEAVE" }
  | { type: "CLICK_CHAIN" }
  | { type: "HOVER_TIMEOUT" }
  | { type: "USER_MESSAGE"; payload: { text: string } }
  | { type: "AI_REPLY"; payload: { text: string } }
  | { type: "AI_ERROR"; payload: { message: string } }
  | { type: "TTS_START" }
  | { type: "TTS_END" }
  | { type: "IDLE_TIMEOUT" }
  | { type: "HIDE" }
  | { type: "SHOW" }
  | { type: "ANIMATION_END" };

export type ChatMode = "local" | "ai";

export interface PetAnimation {
  file?: string;
  path?: string;
  framePrefix?: string;
  frameCount?: number;
  frameExtension?: string;
  sequence?: number[];
  fps: number;
  loop: boolean;
  duration?: number;
}

export interface PetConfig {
  name: string;
  displayName: string;
  defaultState: PetState;
  size: {
    width: number;
    height: number;
  };
  animations: Record<string, PetAnimation>;
}
