import type { PetEvent, PetState } from "./petTypes";

export function petReducer(state: PetState, event: PetEvent): PetState {
  if (event.type === "HIDE") {
    return "hidden";
  }

  if (state === "hidden" && event.type === "SHOW") {
    return "idle";
  }

  switch (state) {
    case "idle": {
      switch (event.type) {
        case "CLICK":
          return "happy";
        case "USER_MESSAGE":
          return "think";
        case "DRAG_START":
          return "drag";
        case "RIGHT_CLICK":
          return "menu";
        case "IDLE_TIMEOUT":
          return "sleep";
        default:
          return state;
      }
    }

    case "happy": {
      switch (event.type) {
        case "ANIMATION_END":
          return "idle";
        case "DRAG_START":
          return "drag";
        case "USER_MESSAGE":
          return "think";
        case "RIGHT_CLICK":
          return "menu";
        default:
          return state;
      }
    }

    case "sleep": {
      switch (event.type) {
        case "CLICK":
          return "happy";
        case "DOUBLE_CLICK":
          return "idle";
        case "DRAG_START":
          return "drag";
        case "RIGHT_CLICK":
          return "menu";
        default:
          return state;
      }
    }

    case "think": {
      switch (event.type) {
        case "AI_REPLY":
          return "talk";
        case "AI_ERROR":
          return "idle";
        case "DRAG_START":
          return "drag";
        case "RIGHT_CLICK":
          return "menu";
        default:
          return state;
      }
    }

    case "talk": {
      switch (event.type) {
        case "TTS_END":
          return "idle";
        case "DRAG_START":
          return "drag";
        case "RIGHT_CLICK":
          return "menu";
        default:
          return state;
      }
    }

    case "drag": {
      switch (event.type) {
        case "DRAG_END":
          return "idle";
        default:
          return state;
      }
    }

    case "menu": {
      switch (event.type) {
        case "MENU_CLOSE":
          return "idle";
        default:
          return state;
      }
    }

    default:
      return state;
  }
}
