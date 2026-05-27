import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import ChatBox from "./components/ChatBox";
import ContextMenu, { type ContextMenuPosition } from "./components/ContextMenu";
import FocusPanel from "./components/FocusPanel";
import FocusTimer from "./components/FocusTimer";
import Pet, { closePetWindow, hidePetWindow } from "./components/Pet";
import SettingsPanel from "./components/SettingsPanel";
import SpeechBubble, { type BubbleType, type SpeechBubbleData } from "./components/SpeechBubble";
import UpdateDialog from "./components/UpdateDialog";
import { appConfig } from "./config/appConfig";
import { giftConfig } from "./ai/giftConfig";
import type { PetAction, PetAIReply } from "./ai/characterTypes";
import {
  addRecentMessage,
  addMemory,
  buildMemorySummary,
  deleteMemory,
  formatMemoryList,
  hasSeenFirstLaunch,
  loadPetMemory,
  markFirstLaunchSeen,
  parseMemoryIntent,
  resetFirstLaunch,
  savePetMemory
} from "./ai/memoryService";
import { buildFocusCompleteReply, handleFocusIntent } from "./focus/focusIntentHandler";
import { parseFocusIntent } from "./focus/focusIntentParser";
import {
  cancelFocusSession,
  loadFocusState,
  normalizeFocusState,
  pauseFocusSession,
  resumeFocusSession,
  saveFocusState,
  startFocusSession
} from "./focus/focusService";
import type { FocusState } from "./focus/focusTypes";
import { resetIdleTimer } from "./pet/idleTimer";
import { clickReplies, pickRandom, randomReplies } from "./pet/petConfig";
import { petReducer } from "./pet/petStateMachine";
import type { ChatMode, PetEvent, PetState, TimeZoneMode } from "./pet/petTypes";
import { getAutostartEnabled, setAutostartEnabled } from "./services/autostartService";
import { getPetReply, testDeepSeekConnection } from "./services/chatService";
import { loadAppSettings, saveAppSettings } from "./services/storageService";
import { createTimeContext, getTimeIdleState } from "./services/timeService";
import { speak } from "./services/ttsService";
import {
  checkForAvailableUpdate,
  installAvailableUpdate,
  type AppUpdateInfo,
  type UpdateStatus
} from "./services/updateService";

const replyVisibleMs = 60 * 1000;
const chatVisibleMs = 60 * 1000;
const timeIdleStates: PetState[] = ["idle", "wakeup", "energetic", "sleepy"];

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
    "CLICK_CHAIN",
    "HOVER_TIMEOUT",
    "USER_MESSAGE",
    "MENU_CLOSE",
    "HIDE",
    "SHOW"
  ].includes(event.type);
}

export default function App() {
  const initialSettings = loadAppSettings();
  const [state, dispatch] = useReducer(petReducer, getTimeIdleState(initialSettings.timeZoneMode));
  const [bubble, setBubble] = useState<SpeechBubbleData | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(appConfig.defaultChatMode);
  const [timeZoneMode, setTimeZoneMode] = useState<TimeZoneMode>(initialSettings.timeZoneMode);
  const [autostartEnabled, setAutostartEnabledState] = useState(false);
  const [autostartPending, setAutostartPending] = useState(false);
  const [deepseekApiKey, setDeepseekApiKey] = useState(() => {
    const stored = initialSettings.deepseekApiKey;
    return stored || appConfig.deepseekApiKey;
  });
  const [replyText, setReplyText] = useState("");
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [updateInstalling, setUpdateInstalling] = useState(false);
  const [focusState, setFocusState] = useState<FocusState>(() => loadFocusState());
  const [focusPanelOpen, setFocusPanelOpen] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition>({ x: 20, y: 20 });
  const latestReplyRef = useRef("");
  const latestReplyActionRef = useRef<PetAction>("talk");
  const pendingReplyTimerRef = useRef<number | null>(null);

  const showBubble = useCallback(
    (text: string, type: BubbleType = "normal", duration = 3600, closable = duration <= 0) => {
      setBubble(createBubble(text, type, duration, closable));
    },
    []
  );

  const showReply = useCallback(
    (reply: PetAIReply) => {
      latestReplyRef.current = reply.text;
      latestReplyActionRef.current = reply.action;
      setReplyText(reply.text);
      showBubble(reply.text, "normal", replyVisibleMs, true);
      dispatch({ type: "AI_REPLY", payload: reply });
    },
    [showBubble]
  );

  const playReply = useCallback(
    (reply: PetAIReply) => {
      if (pendingReplyTimerRef.current) {
        window.clearTimeout(pendingReplyTimerRef.current);
      }

      if (reply.action === "happy" || reply.action === "think") {
        dispatch({ type: "FORCE_ACTION", payload: { action: reply.action } });
        pendingReplyTimerRef.current = window.setTimeout(() => {
          pendingReplyTimerRef.current = null;
          showReply(reply);
        }, reply.action === "happy" ? 1100 : 800);
        return;
      }

      showReply(reply);
    },
    [showReply]
  );

  const sendEvent = useCallback(
    (event: PetEvent) => {
      if (isInteraction(event)) {
        resetIdleTimer();
      }

      switch (event.type) {
        case "CLICK":
          showBubble(
            focusState.session?.status === "running" && focusState.session.mode === "focus"
              ? "Tiny steps. Keep going."
              : state === "sleep"
                ? "I'm awake."
                : pickRandom(clickReplies),
            "normal",
            3200
          );
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
          {
            const memory = addRecentMessage(loadPetMemory(), "user", event.payload.text);
            const memoryIntent = appConfig.features.memorySystem ? parseMemoryIntent(event.payload.text) : null;

            if (memoryIntent) {
              const { memory: nextMemory, reply } = handleMemoryIntent(memory, memoryIntent);
              savePetMemory(addRecentMessage(nextMemory, "assistant", JSON.stringify(reply)));
              playReply(reply);
              return;
            }

            const focusIntent = appConfig.features.focusTimer && appConfig.features.focusChatCommands
              ? parseFocusIntent(event.payload.text)
              : null;

            if (focusIntent) {
              const result = handleFocusIntent(focusIntent, focusState);
              setFocusState(result.state);
              saveFocusState(result.state);
              savePetMemory(addRecentMessage(memory, "assistant", JSON.stringify(result.reply)));
              playReply(result.reply);
              return;
            }

            getPetReply(event.payload.text, chatMode, {
              deepseekApiKey,
              timeZoneMode,
              userNickname: memory.userNickname,
              memorySummary: buildMemorySummary(memory),
              recentMessages: memory.recentMessages
            })
            .then((reply) => {
              savePetMemory(addRecentMessage(memory, "assistant", JSON.stringify(reply)));
              playReply(reply);
            })
            .catch((error: unknown) => {
              const message = error instanceof Error ? error.message : "I could not reply right now.";
              showBubble(message, "error", replyVisibleMs, true);
              dispatch({ type: "AI_ERROR", payload: { message } });
            });
          }
          return;

        case "AI_REPLY":
          latestReplyRef.current = event.payload.text;
          latestReplyActionRef.current = event.payload.action;
          setReplyText(event.payload.text);
          showBubble(event.payload.text, "normal", replyVisibleMs, true);
          dispatch(event);
          return;

        case "AI_ERROR":
          showBubble(event.payload.message, "error", replyVisibleMs, true);
          dispatch(event);
          return;

        case "IDLE_TIMEOUT":
          dispatch({ type: "TIME_IDLE_STATE", payload: { state: getTimeIdleState(timeZoneMode) } });
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
    [chatMode, deepseekApiKey, focusState, playReply, showBubble, state, timeZoneMode]
  );

  useEffect(() => {
    saveAppSettings({ deepseekApiKey, timeZoneMode });
  }, [deepseekApiKey, timeZoneMode]);

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
    if (!appConfig.features.focusTimer) {
      return;
    }

    const timer = window.setInterval(() => {
      setFocusState((current) => {
        const next = normalizeFocusState(current);

        if (next.completedSession) {
          const completed = next.completedSession;
          const finalState = { session: null };
          saveFocusState(finalState);
          playReply(buildFocusCompleteReply(completed.mode));
          return finalState;
        }

        saveFocusState(next);
        return next.session ? { session: { ...next.session } } : next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [playReply]);

  useEffect(() => {
    if (!appConfig.features.firstLaunchGreeting || hasSeenFirstLaunch()) {
      return;
    }

    markFirstLaunchSeen();
    latestReplyRef.current = giftConfig.firstOpenMessage;
    latestReplyActionRef.current = "happy";
    setReplyText(giftConfig.firstOpenMessage);
    showBubble(giftConfig.firstOpenMessage, "system", replyVisibleMs, true);
    dispatch({ type: "FORCE_ACTION", payload: { action: "happy" } });

    let finished = false;
    speak(giftConfig.firstOpenMessage, () => {
      if (!finished) {
        finished = true;
        dispatch({ type: "ANIMATION_END" });
      }
    });

    return () => {
      finished = true;
    };
  }, [showBubble]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (!appConfig.features.updater) {
        return;
      }

      checkForAvailableUpdate().then((info) => {
        if (!cancelled && info) {
          setUpdateInfo(info);
          setUpdateStatus(null);
          showBubble(`Bubu ${info.version} is available.`, "system", 0, true);
        }
      }).catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Update failed.";
          showBubble(message, "error", 0, true);
        }
      });
    }, 1800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [showBubble]);

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
      if (timeIdleStates.includes(state)) {
        dispatch({ type: "TIME_IDLE_STATE", payload: { state: getTimeIdleState(timeZoneMode) } });
      }
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, [state, timeZoneMode]);

  useEffect(() => {
    if (timeIdleStates.includes(state)) {
      dispatch({ type: "TIME_IDLE_STATE", payload: { state: getTimeIdleState(timeZoneMode) } });
    }
  }, [state, timeZoneMode]);

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
          if (latestReplyActionRef.current === "sleep") {
            dispatch({ type: "FORCE_ACTION", payload: { action: "sleep" } });
          } else {
            dispatch({ type: "TTS_END" });
          }
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
    return () => {
      if (pendingReplyTimerRef.current) {
        window.clearTimeout(pendingReplyTimerRef.current);
      }
    };
  }, []);

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

  function handleTimeZoneModeChange(mode: TimeZoneMode) {
    setTimeZoneMode(mode);
    showBubble(createTimeContext(mode), "system", 0, true);
  }

  function handleResetFirstLaunch() {
    resetFirstLaunch();
    showBubble("First launch greeting will replay next time.", "system", 0, true);
  }

  function startFocusFromPanel(mode: "focus" | "break") {
    const nextState = startFocusSession(mode, focusMinutes);
    setFocusState(nextState);
    saveFocusState(nextState);
    setFocusPanelOpen(false);
    playReply({
      action: "happy",
      emotion: mode === "focus" ? "happy" : "caring",
      text: mode === "focus"
        ? `Okay. Bubu will guard your ${focusMinutes}-minute focus time.`
        : `Rest for ${focusMinutes} minutes. Bubu will call you back.`
    });
  }

  function updateFocusState(nextState: FocusState, reply: PetAIReply) {
    setFocusState(nextState);
    saveFocusState(nextState);
    playReply(reply);
  }

  function handleFocusPause() {
    updateFocusState(pauseFocusSession(focusState), {
      action: "talk",
      emotion: "thinking",
      text: "Paused. Bubu will keep your place."
    });
  }

  function handleFocusResume() {
    updateFocusState(resumeFocusSession(focusState), {
      action: "happy",
      emotion: "happy",
      text: "Back to it. Bubu is with you."
    });
  }

  function handleFocusCancel() {
    updateFocusState(cancelFocusSession(), {
      action: "talk",
      emotion: "neutral",
      text: "Focus timer ended. Bubu is still here."
    });
  }

  async function handleInstallUpdate() {
    setUpdateInstalling(true);
    setUpdateStatus({ type: "info", message: "Preparing update..." });

    try {
      await installAvailableUpdate(setUpdateStatus);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Update failed.";
      setUpdateInstalling(false);
      setUpdateStatus({ type: "error", message });
      showBubble(message, "error", 0, true);
    }
  }

  return (
    <main className={`app app-${state}`} onPointerDown={() => state === "menu" && sendEvent({ type: "MENU_CLOSE" })}>
      <SpeechBubble bubble={bubble} onClose={() => setBubble(null)} />
      {appConfig.features.focusTimer ? (
        <FocusTimer
          session={focusState.session}
          onPause={handleFocusPause}
          onResume={handleFocusResume}
          onCancel={handleFocusCancel}
        />
      ) : null}
      <Pet state={state} onEvent={sendEvent} onContextMenuPosition={setContextMenuPosition} />
      <ChatBox open={chatOpen} onClose={() => setChatOpen(false)} onSend={handleSendMessage} />
      <ContextMenu
        open={state === "menu"}
        position={contextMenuPosition}
        onChat={() => {
          setChatOpen(true);
          showBubble("What would you like to say?", "system", 3000);
        }}
        onFocus={() => setFocusPanelOpen(true)}
        onRandomLine={handleRandomLine}
        onHide={() => sendEvent({ type: "HIDE" })}
        onSettings={handleSettingsOpen}
        onExit={closePetWindow}
        onClose={() => sendEvent({ type: "MENU_CLOSE" })}
        focusEnabled={appConfig.features.focusTimer}
      />
      <FocusPanel
        open={appConfig.features.focusTimer && focusPanelOpen}
        selectedMinutes={focusMinutes}
        onMinutesChange={setFocusMinutes}
        onStartFocus={() => startFocusFromPanel("focus")}
        onStartBreak={() => startFocusFromPanel("break")}
        onClose={() => setFocusPanelOpen(false)}
      />
      <SettingsPanel
        open={settingsOpen}
        chatMode={chatMode}
        timeZoneMode={timeZoneMode}
        deepseekApiKey={deepseekApiKey}
        autostartEnabled={autostartEnabled}
        autostartPending={autostartPending}
        onChatModeChange={setChatMode}
        onTimeZoneModeChange={handleTimeZoneModeChange}
        onDeepseekApiKeyChange={setDeepseekApiKey}
        onAutostartChange={handleAutostartChange}
        onResetFirstLaunch={handleResetFirstLaunch}
        onClose={() => setSettingsOpen(false)}
      />
      <UpdateDialog
        open={Boolean(updateInfo)}
        updateInfo={updateInfo}
        status={updateStatus}
        installing={updateInstalling}
        onInstall={handleInstallUpdate}
        onClose={() => {
          if (!updateInstalling) {
            setUpdateInfo(null);
            setUpdateStatus(null);
          }
        }}
      />
    </main>
  );
}

function handleMemoryIntent(
  memory: ReturnType<typeof loadPetMemory>,
  intent: NonNullable<ReturnType<typeof parseMemoryIntent>>
): { memory: ReturnType<typeof loadPetMemory>; reply: PetAIReply } {
  switch (intent.type) {
    case "add": {
      const nextMemory = addMemory(memory, intent.content);
      return {
        memory: nextMemory,
        reply: {
          action: "happy",
          emotion: "happy",
          text: "Got it. Bubu will remember that."
        }
      };
    }

    case "view":
      return {
        memory,
        reply: {
          action: "talk",
          emotion: "thinking",
          text: formatMemoryList(memory)
        }
      };

    case "delete": {
      const result = deleteMemory(memory, intent.target);
      return {
        memory: result.memory,
        reply: {
          action: "talk",
          emotion: "neutral",
          text: result.deletedCount > 0 ? "Memory deleted." : "Tell Bubu which memory to delete."
        }
      };
    }
  }
}
