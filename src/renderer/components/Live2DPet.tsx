import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";
import { live2dPetConfig } from "../pet/petConfig";
import type { PetState } from "../pet/petTypes";

interface Live2DPetProps {
  state: PetState;
}

type Live2DModelInstance = InstanceType<typeof Live2DModel> & {
  internalModel?: {
    coreModel?: {
      setParameterValueById?: (id: string, value: number, weight?: number) => void;
    };
  };
};

const stateMood: Record<string, number> = {
  wakeup: -0.15,
  energetic: 0.2,
  sleepy: -0.45,
  happy: 0.75,
  think: 0.05,
  talk: 0.35,
  drag: 0.25,
  look: 0.1,
  annoyed: -0.35,
  drop: 0.2,
  shy: -0.05,
  idle: 0
};

export default function Live2DPet({ state }: Live2DPetProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<Live2DModelInstance | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const stateRef = useRef(state);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    stateRef.current = state;

    const model = modelRef.current;

    if (!model) {
      return;
    }

    if (state === "happy" || state === "drop") {
      model.motion("Tap").catch(() => {});
    }

    if (state === "annoyed" || state === "shy" || state === "sleepy") {
      model.expression().catch(() => {});
    }
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;

    if (!host) {
      return;
    }

    window.PIXI = PIXI;

    const app = new PIXI.Application({
      width: host.clientWidth,
      height: host.clientHeight,
      antialias: true,
      autoDensity: true,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1
    });
    appRef.current = app;
    host.appendChild(app.view as HTMLCanvasElement);

    Live2DModel.from(live2dPetConfig.modelUrl, { autoInteract: false })
      .then((model: Live2DModelInstance) => {
        if (cancelled) {
          model.destroy();
          return;
        }

        const live2dModel = model as Live2DModelInstance;
        modelRef.current = live2dModel;
        live2dModel.anchor.set(0.5, 0.84);
        live2dModel.position.set(app.renderer.width / 2, app.renderer.height * 0.98);
        live2dModel.scale.set(Math.min(app.renderer.width / live2dModel.width, app.renderer.height / live2dModel.height) * 1.35);
        app.stage.addChild(live2dModel);
        live2dModel.motion("Idle").catch(() => {});

        app.ticker.add(() => {
          applyStateParameters(live2dModel, stateRef.current, performance.now());
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      modelRef.current = null;
      app.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
    };
  }, []);

  return (
    <div className="live2d-pet-stage" ref={hostRef}>
      {failed ? (
        <div className="pet-fallback" aria-label="Bubu Live2D fallback">
          <div className="pet-ear pet-ear-left" />
          <div className="pet-ear pet-ear-right" />
          <div className="pet-face">
            <span className="pet-eye" />
            <span className="pet-eye" />
            <span className="pet-mouth" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function applyStateParameters(model: Live2DModelInstance, state: PetState, now: number) {
  const pulse = Math.sin(now / 220);
  const slow = Math.sin(now / 900);
  const mood = stateMood[state] ?? 0;
  const talking = state === "talk";
  const sleepy = state === "sleepy" || state === "sleep";
  const thinking = state === "think";

  setParam(model, "ParamAngleX", state === "look" ? 16 : slow * 5 + mood * 8);
  setParam(model, "ParamAngleY", sleepy ? -8 : thinking ? 6 : slow * 2);
  setParam(model, "ParamAngleZ", state === "drag" ? pulse * 8 : state === "happy" ? pulse * 5 : slow * 2);
  setParam(model, "ParamBodyAngleX", state === "drag" ? pulse * 7 : slow * 3);
  setParam(model, "ParamEyeBallX", state === "look" ? 0.65 : slow * 0.25);
  setParam(model, "ParamEyeBallY", sleepy ? -0.45 : thinking ? 0.35 : slow * 0.12);
  setParam(model, "ParamMouthOpenY", talking ? 0.35 + Math.abs(pulse) * 0.65 : state === "happy" ? 0.35 : 0.05);
  setParam(model, "ParamEyeLOpen", sleepy ? 0.28 : state === "shy" ? 0.65 : 1);
  setParam(model, "ParamEyeROpen", sleepy ? 0.28 : state === "shy" ? 0.65 : 1);
}

function setParam(model: Live2DModelInstance, id: string, value: number) {
  model.internalModel?.coreModel?.setParameterValueById?.(id, value);
}
