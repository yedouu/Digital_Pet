/// <reference types="vite/client" />

declare global {
  interface Window {
    PIXI?: typeof import("pixi.js");
    Live2DCubismCore?: unknown;
  }
}

export {};
