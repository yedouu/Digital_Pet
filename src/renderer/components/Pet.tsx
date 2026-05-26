import { type MouseEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { getAnimationDuration, getAnimationFps, getAnimationFrameUrls, getAnimationUrl } from "../pet/animationPlayer";
import { defaultPetConfig, interactionEffects } from "../pet/petConfig";
import type { PetEvent, PetState } from "../pet/petTypes";
import { loadPetPosition, savePetPosition } from "../services/storageService";
import type { ContextMenuPosition } from "./ContextMenu";

interface PetProps {
  state: PetState;
  animationSignal: number;
  onEvent: (event: PetEvent) => void;
  onContextMenuPosition: (position: ContextMenuPosition) => void;
}

interface TauriWindowApi {
  appWindow: {
    outerPosition: () => Promise<{ x: number; y: number }>;
    setPosition: (position: any) => Promise<void>;
    hide: () => Promise<void>;
    close: () => Promise<void>;
  };
  currentMonitor: () => Promise<{ scaleFactor: number } | null>;
  PhysicalPosition: new (x: number, y: number) => any;
}

let tauriWindowApiPromise: Promise<TauriWindowApi | null> | null = null;

function getTauriWindowApi(): Promise<TauriWindowApi | null> {
  if (!("__TAURI_INTERNALS__" in window)) {
    return Promise.resolve(null);
  }

  const promise = tauriWindowApiPromise ?? import("@tauri-apps/api/window")
    .then((api) => ({
      appWindow: api.getCurrentWindow(),
      currentMonitor: api.currentMonitor,
      PhysicalPosition: api.PhysicalPosition
    }))
    .catch(() => null);

  tauriWindowApiPromise = promise;
  return promise;
}

export async function hidePetWindow() {
  const api = await getTauriWindowApi();
  await api?.appWindow.hide();
}

export async function closePetWindow() {
  const api = await getTauriWindowApi();
  await api?.appWindow.close();
}

export default function Pet({ state, animationSignal, onEvent, onContextMenuPosition }: PetProps) {
  const pointerStartRef = useRef<{
    x: number;
    y: number;
    windowX: number;
    windowY: number;
    scaleFactor: number;
  } | null>(null);
  const draggingRef = useRef(false);
  const hoverTimerRef = useRef<number | null>(null);
  const clickBurstRef = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: 0 });
  const clickTimerRef = useRef<number | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const frameUrls = getAnimationFrameUrls(defaultPetConfig, state);
  const animationUrl = frameUrls[frameIndex] ?? getAnimationUrl(defaultPetConfig, state);
  const duration = getAnimationDuration(defaultPetConfig, state);
  const fps = getAnimationFps(defaultPetConfig, state);

  useEffect(() => {
    let cancelled = false;

    async function restorePosition() {
      const position = loadPetPosition();
      const api = await getTauriWindowApi();

      if (!cancelled && position && api) {
        await api.appWindow.setPosition(new api.PhysicalPosition(position.x, position.y));
      }
    }

    restorePosition();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!duration) {
      return;
    }

    const timer = window.setTimeout(() => onEvent({ type: "ANIMATION_END" }), duration);
    return () => window.clearTimeout(timer);
  }, [animationSignal, duration, onEvent, state]);

  useEffect(() => {
    setImageFailed(false);
  }, [animationUrl]);

  useEffect(() => {
    setFrameIndex(0);
  }, [animationSignal, state]);

  useEffect(() => {
    if (frameUrls.length <= 1 || state === "hidden") {
      return;
    }

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frameUrls.length);
    }, 1000 / fps);

    return () => window.clearInterval(timer);
  }, [fps, frameUrls.length, state]);

  if (state === "hidden") {
    return null;
  }

  function clearHoverTimer() {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }

  function startHoverTimer() {
    clearHoverTimer();

    if (interactionEffects.hoverShy) {
      hoverTimerRef.current = window.setTimeout(() => onEvent({ type: "HOVER_TIMEOUT" }), 1800);
    }
  }

  function handlePointerEnter() {
    startHoverTimer();

    if (interactionEffects.lookAtMouse) {
      onEvent({ type: "MOUSE_NEAR" });
    }
  }

  async function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const api = await getTauriWindowApi();
    const position = api ? await api.appWindow.outerPosition() : { x: 0, y: 0 };
    const monitor = api ? await api.currentMonitor() : null;
    pointerStartRef.current = {
      x: event.screenX,
      y: event.screenY,
      windowX: position.x,
      windowY: position.y,
      scaleFactor: monitor?.scaleFactor ?? window.devicePixelRatio ?? 1
    };
    draggingRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  async function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current;

    if (!start) {
      return;
    }

    const deltaX = (event.screenX - start.x) * start.scaleFactor;
    const deltaY = (event.screenY - start.y) * start.scaleFactor;
    const distance = Math.hypot(deltaX, deltaY);

    if (!draggingRef.current && distance > 5) {
      draggingRef.current = true;
      clearHoverTimer();
      onEvent({ type: "DRAG_START" });
    }

    if (draggingRef.current) {
      const nextPosition = {
        x: Math.round(start.windowX + deltaX),
        y: Math.round(start.windowY + deltaY)
      };
      const api = await getTauriWindowApi();
      await api?.appWindow.setPosition(new api.PhysicalPosition(nextPosition.x, nextPosition.y));
    }
  }

  async function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const wasDragging = draggingRef.current;
    const api = await getTauriWindowApi();

    if (wasDragging) {
      const position = api ? await api.appWindow.outerPosition() : null;

      if (position) {
        savePetPosition({ x: position.x, y: position.y });
      }

      onEvent({ type: "DRAG_END" });
    } else {
      handleClickIntent();
    }

    pointerStartRef.current = null;
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleClickIntent() {
    const now = Date.now();
    const burst = clickBurstRef.current;
    const count = now - burst.lastTime < 900 ? burst.count + 1 : 1;
    clickBurstRef.current = { count, lastTime: now };

    if (interactionEffects.clickChainAnnoyed && count >= 3) {
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }

      clickBurstRef.current = { count: 0, lastTime: 0 };
      onEvent({ type: "CLICK_CHAIN" });
      return;
    }

    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      onEvent({ type: "DOUBLE_CLICK" });
      return;
    }

    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      onEvent({ type: "CLICK" });
    }, 200);
  }

  function handleContextMenu(event: MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    pointerStartRef.current = null;
    draggingRef.current = false;
    clearHoverTimer();
    onContextMenuPosition({
      x: Math.min(Math.max(event.clientX, 6), window.innerWidth - 134),
      y: Math.min(Math.max(event.clientY, 6), window.innerHeight - 158)
    });
    onEvent({ type: "RIGHT_CLICK" });
  }

  function handlePointerLeave() {
    clearHoverTimer();
    pointerStartRef.current = null;
    draggingRef.current = false;
    onEvent({ type: "MOUSE_LEAVE" });
  }

  return (
    <div
      className={`pet pet-${state}`}
      style={{ width: defaultPetConfig.size.width, height: defaultPetConfig.size.height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onContextMenu={handleContextMenu}
    >
      {animationUrl && !imageFailed ? (
        <img
          src={animationUrl}
          alt={defaultPetConfig.displayName}
          draggable={false}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="pet-fallback" aria-label={defaultPetConfig.displayName}>
          <div className="pet-ear pet-ear-left" />
          <div className="pet-ear pet-ear-right" />
          <div className="pet-face">
            <span className="pet-eye" />
            <span className="pet-eye" />
            <span className="pet-mouth" />
          </div>
        </div>
      )}
    </div>
  );
}
