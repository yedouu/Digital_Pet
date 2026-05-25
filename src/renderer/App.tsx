import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import ChatBox from "./components/ChatBox";
import ContextMenu, { type ContextMenuPosition } from "./components/ContextMenu";
import Pet, { closePetWindow, hidePetWindow } from "./components/Pet";
import SettingsPanel from "./components/SettingsPanel";
import SpeechBubble, { type BubbleType, type SpeechBubbleData } from "./components/SpeechBubble";
import { appConfig } from "./config/appConfig";
import { resetIdleTimer, shouldEnterSleep } from "./pet/idleTimer";
import { clickReplies, pickRandom, randomReplies } from "./pet/petConfig";
import { petReducer } from "./pet/petStateMachine";
import type { ChatMode, PetEvent } from "./pet/petTypes";
import { getAutostartEnabled, setAutostartEnabled } from "./services/autostartService";
import { getPetReply, testDeepSeekConnection } from "./services/chatService";
import { loadAppSettings, saveAppSettings } from "./services/storageService";
import { speak } from "./services/ttsService";

const sleepTimeoutMs = 5 * 60 * 1000;
const replyVisibleMs = 60 * 1000;
const chatVisibleMs = 60 * 1000;

function createBubble(
  text: string,
  type: BubbleType,
  duration: number,
  closable = duration <= 0
): SpeechBubbleData {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    type,
    duration,
    createdAt: Date.now(),
    closable
  };
}

function isInteraction(event: PetEvent): boolean {
  return [
    "CLICK",
    "DOUBLE_CLICK",
    "RIGHT_CLICK",
    "DRAG_START",
    "DRAG_END",
    "MOUSE_NEAR",
    "MOUSE_LEAVE",
    "MOUSE_FAST_MOVE",
    "CLICK_CHAIN",
    "HOVER_TIMEOUT",
    "USER_MESSAGE",
    "MENU_CLOSE",
    "HIDE",
    "SHOW"
  ].includes(event.type);
}

export default function App() {
  const [state, dispatch] = useReducer(petReducer, "idle");
  const [bubble, setBubble] = useState<SpeechBubbleData | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(appConfig.defaultChatMode);
  const [autostartEnabled, setAutostartEnabledState] = useState(false);
  const [autostartPending, setAutostartPending] = useState(false);
  const [deepseekApiKey, setDeepseekApiKey] = useState(() => {
    const stored = loadAppSettings().deepseekApiKey;
    return stored || appConfig.deepseekApiKey;
  });
  const [replyText, setReplyText] = useState("");
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition>({ x: 20, y: 20 });
  const latestReplyRef = useRef("");

  const showBubble = useCallback(
    (text: string, type: BubbleType = "normal", duration = 3600, closable = duration <= 0) => {
      setBubble(createBubble(text, type, duration, closable));
    },
    []
  );

  const sendEvent = useCallback(
    (event: PetEvent) => {
      if (isInteraction(event)) {
        resetIdleTimer();
      }

      switch (event.type) {
        case "CLICK":
          showBubble(state === "sleep" ? "I'm awake." : pickRandom(clickReplies), "normal", 3200);
          dispatch(event);
          return;

        case "DOUBLE_CLICK":
          setChatOpen(true);
          showBubble("What would you like to say?", "system", 3000);
          dispatch(event);
          return;

        case "RIGHT_CLICK":
        case "MENU_CLOSE":
          dispatch(event);
          return;

        case "MOUSE_NEAR":
        case "MOUSE_LEAVE":
          dispatch(event);
          return;

        case "MOUSE_FAST_MOVE":
          showBubble("Whoa!", "system", 2400);
          dispatch(event);
          return;

        case "CLICK_CHAIN":
          showBubble("Hey, easy!", "system", 3200);
          dispatch(event);
          return;

        case "HOVER_TIMEOUT":
          showBubble("You're making me shy.", "system", 3200);
          dispatch(event);
          return;

        case "USER_MESSAGE":
          showBubble("Let me think...", "thinking", 0, false);
          dispatch(event);
          getPetReply(event.payload.text, chatMode, { deepseekApiKey })
            .then((reply) => {
              latestReplyRef.current = reply;
              setReplyText(reply);
              showBubble(reply, "normal", replyVisibleMs, true);
              dispatch({ type: "AI_REPLY", payload: { text: reply } });
            })
            .catch((error: unknown) => {
              const message = error instanceof Error ? error.message : "I could not reply right now.";
              showBubble(message, "error", replyVisibleMs, true);
              dispatch({ type: "AI_ERROR", payload: { message } });
            });
          return;

        case "AI_REPLY":
          latestReplyRef.current = event.payload.text;
          setReplyText(event.payload.text);
          showBubble(event.payload.text, "normal", replyVisibleMs, true);
          dispatch(event);
          return;

        case "AI_ERROR":
          showBubble(event.payload.message, "error", replyVisibleMs, true);
          dispatch(event);
          return;

        case "IDLE_TIMEOUT":
          showBubble("Zzz...", "system", 0, false);
          dispatch(event);
          return;

        case "HIDE":
          dispatch(event);
          hidePetWindow();
          return;

        case "SHOW":
          dispatch(event);
          showBubble("I'm back.", "system", 3000);
          return;

        default:
          dispatch(event);
      }
    },
    [chatMode, deepseekApiKey, showBubble, state]
  );

  useEffect(() => {
    saveAppSettings({ deepseekApiKey });
  }, [deepseekApiKey]);

  useEffect(() => {
    let cancelled = false;

    getAutostartEnabled().then((enabled) => {
      if (!cancelled) {
        setAutostartEnabledState(enabled);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!chatOpen) {
      return;
    }

    const timer = window.setTimeout(() => setChatOpen(false), chatVisibleMs);
    return () => window.clearTimeout(timer);
  }, [chatOpen]);

  useEffect(() => {
    let cancelled = false;

    async function testDefaultApiMode() {
      if (chatMode !== "ai") {
        return;
      }

      const available = await testDeepSeekConnection(deepseekApiKey);

      if (!cancelled && !available) {
        setChatMode("local");
        showBubble("DeepSeek is not available, so I switched to local mode.", "system", 0, true);
      }
    }

    testDefaultApiMode();

    return () => {
      cancelled = true;
    };
  }, [chatMode, deepseekApiKey, showBubble]);

  useEffect(() => {
    if (!bubble || bubble.duration <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setBubble((current) => (current?.id === bubble.id ? null : current));
    }, bubble.duration);

    return () => window.clearTimeout(timer);
  }, [bubble]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (state === "idle" && shouldEnterSleep(sleepTimeoutMs)) {
        sendEvent({ type: "IDLE_TIMEOUT" });
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [sendEvent, state]);

  useEffect(() => {
    if (state !== "talk" || !replyText) {
      return;
    }

    let finished = false;
    dispatch({ type: "TTS_START" });
    speak(
      replyText,
      () => {
        if (!finished && latestReplyRef.current === replyText) {
          finished = true;
          dispatch({ type: "TTS_END" });
        }
      },
      () => {
        if (!finished) {
          showBubble("Voice is unavailable, but the reply is shown above.", "system", 0, true);
        }
      }
    );

    return () => {
      finished = true;
    };
  }, [replyText, showBubble, state]);

  useEffect(() => {
    function handleTrayShow() {
      sendEvent({ type: "SHOW" });
    }

    window.addEventListener("pet-show-from-tray", handleTrayShow);
    return () => window.removeEventListener("pet-show-from-tray", handleTrayShow);
  }, [sendEvent]);

  function handleRandomLine() {
    showBubble(pickRandom(randomReplies), "normal", 0, true);
  }

  function handleSettingsOpen() {
    setSettingsOpen(true);
    showBubble("Settings opened.", "system", 3000);
  }

  function handleSendMessage(text: string) {
    sendEvent({ type: "USER_MESSAGE", payload: { text } });
  }

  async function handleAutostartChange(enabled: boolean) {
    setAutostartPending(true);

    try {
      const nextEnabled = await setAutostartEnabled(enabled);
      setAutostartEnabledState(nextEnabled);
    } catch {
      showBubble("Could not update startup setting.", "error", 4000);
    } finally {
      setAutostartPending(false);
    }
  }

  return (
    <main className={`app app-${state}`} onPointerDown={() => state === "menu" && sendEvent({ type: "MENU_CLOSE" })}>
      <SpeechBubble bubble={bubble} onClose={() => setBubble(null)} />
      <Pet state={state} onEvent={sendEvent} onContextMenuPosition={setContextMenuPosition} />
      <ChatBox open={chatOpen} onClose={() => setChatOpen(false)} onSend={handleSendMessage} />
      <ContextMenu
        open={state === "menu"}
        position={contextMenuPosition}
        onChat={() => {
          setChatOpen(true);
          showBubble("What would you like to say?", "system", 3000);
        }}
        onRandomLine={handleRandomLine}
        onHide={() => sendEvent({ type: "HIDE" })}
        onSettings={handleSettingsOpen}
        onExit={closePetWindow}
        onClose={() => sendEvent({ type: "MENU_CLOSE" })}
      />
      <SettingsPanel
        open={settingsOpen}
        chatMode={chatMode}
        deepseekApiKey={deepseekApiKey}
        autostartEnabled={autostartEnabled}
        autostartPending={autostartPending}
        onChatModeChange={setChatMode}
        onDeepseekApiKeyChange={setDeepseekApiKey}
        onAutostartChange={handleAutostartChange}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
  );
}
