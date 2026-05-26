import type { PetAction } from "../ai/characterTypes";
import type { PetEvent, PetState } from "./petTypes";
import { interactionEffects } from "./petConfig";

const timeIdleStates: PetState[] = ["idle", "wakeup", "energetic", "sleepy"];

export function petReducer(state: PetState, event: PetEvent): PetState {
  if (event.type === "HIDE") {
    return "hidden";
  }

  if (event.type === "FORCE_ACTION" && state !== "hidden") {
    return actionToState(event.payload.action);
  }

  if (event.type === "AI_REPLY" && state !== "hidden") {
    return "talk";
  }

  if (event.type === "TIME_IDLE_STATE" && timeIdleStates.includes(state)) {
    return event.payload.state;
  }

  if (state === "hidden" && event.type === "SHOW") {
    return "idle";
  }

  switch (state) {
    case "idle":
    case "wakeup":
    case "energetic":
    case "sleepy": {
      switch (event.type) {
        case "CLICK":
          return "happy";
        case "USER_MESSAGE":
          return "think";
        case "DRAG_START":
          return "drag";
        case "MOUSE_NEAR":
          return "look";
        case "CLICK_CHAIN":
          return "annoyed";
        case "HOVER_TIMEOUT":
          return "shy";
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
        case "CLICK_CHAIN":
          return "annoyed";
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
        case "MOUSE_NEAR":
          return "look";
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
          return interactionEffects.dropWobble ? "drop" : "idle";
        default:
          return state;
      }
    }

    case "look": {
      switch (event.type) {
        case "MOUSE_LEAVE":
          return "idle";
        case "CLICK":
          return "happy";
        case "CLICK_CHAIN":
          return "annoyed";
        case "HOVER_TIMEOUT":
          return "shy";
        case "DRAG_START":
          return "drag";
        case "RIGHT_CLICK":
          return "menu";
        default:
          return state;
      }
    }

    case "annoyed":
    case "drop":
    case "shy": {
      switch (event.type) {
        case "ANIMATION_END":
        case "MOUSE_LEAVE":
          return "idle";
        case "DRAG_START":
          return "drag";
        case "RIGHT_CLICK":
          return "menu";
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

function actionToState(action: PetAction): PetState {
  switch (action) {
    case "happy":
      return "happy";
    case "think":
      return "think";
    case "talk":
      return "talk";
    case "sleep":
      return "sleep";
    case "idle":
    default:
      return "idle";
  }
}
