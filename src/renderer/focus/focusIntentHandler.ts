import type { PetAIReply } from "../ai/characterTypes";
import {
  cancelFocusSession,
  formatFocusTime,
  getRemainingMs,
  pauseFocusSession,
  resumeFocusSession,
  startFocusSession
} from "./focusService";
import type { FocusIntent, FocusState } from "./focusTypes";

export interface FocusIntentResult {
  state: FocusState;
  reply: PetAIReply;
}

export function handleFocusIntent(intent: FocusIntent, state: FocusState): FocusIntentResult {
  switch (intent.type) {
    case "start_focus": {
      return {
        state: startFocusSession("focus", intent.minutes),
        reply: {
          action: "happy",
          emotion: "happy",
          text: `Okay. Bubu will guard your ${intent.minutes}-minute focus time.`
        }
      };
    }

    case "start_break": {
      return {
        state: startFocusSession("break", intent.minutes),
        reply: {
          action: "happy",
          emotion: "caring",
          text: `Rest for ${intent.minutes} minutes. Bubu will call you back.`
        }
      };
    }

    case "pause": {
      const nextState = pauseFocusSession(state);
      return {
        state: nextState,
        reply: {
          action: "talk",
          emotion: "thinking",
          text: nextState.session?.status === "paused" ? "Paused. Bubu will keep your place." : "There is no focus timer to pause."
        }
      };
    }

    case "resume": {
      const nextState = resumeFocusSession(state);
      return {
        state: nextState,
        reply: {
          action: "happy",
          emotion: "happy",
          text: nextState.session?.status === "running" ? "Back to it. Bubu is with you." : "There is no paused timer to resume."
        }
      };
    }

    case "cancel":
      return {
        state: cancelFocusSession(),
        reply: {
          action: "talk",
          emotion: "neutral",
          text: "Focus timer canceled. Bubu is still here."
        }
      };

    case "query": {
      const session = state.session;
      return {
        state,
        reply: {
          action: "talk",
          emotion: "thinking",
          text: session ? `${formatFocusTime(getRemainingMs(session))} left.` : "No focus timer is running right now."
        }
      };
    }
  }
}

export function buildFocusCompleteReply(mode: "focus" | "break"): PetAIReply {
  if (mode === "break") {
    return {
      action: "happy",
      emotion: "happy",
      text: "Break is over. Ready to come back gently?"
    };
  }

  return {
    action: "happy",
    emotion: "caring",
    text: "Focus time is done. Stretch a little and rest your eyes."
  };
}
