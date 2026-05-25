import type { PetConfig, PetState } from "./petTypes";

export const stateToAnimation: Record<PetState, string | null> = {
  idle: "idle",
  happy: "happy",
  sleep: "sleep",
  think: "think",
  talk: "talk",
  drag: "drag",
  look: "look",
  startle: "startle",
  annoyed: "annoyed",
  drop: "drop",
  shy: "shy",
  menu: "idle",
  hidden: null
};

export function getAnimationUrl(config: PetConfig, state: PetState): string | null {
  const animationName = stateToAnimation[state];

  if (!animationName) {
    return null;
  }

  const animation = config.animations[animationName];

  if (!animation) {
    return null;
  }

  if (animation.file) {
    return `/assets/pets/${config.name}/${animation.file}`;
  }

  const frameUrls = getAnimationFrameUrls(config, state);
  return frameUrls[0] ?? null;
}

export function getAnimationDuration(config: PetConfig, state: PetState): number | null {
  const animationName = stateToAnimation[state];

  if (!animationName) {
    return null;
  }

  const animation = config.animations[animationName];
  return animation?.duration ?? null;
}

export function getAnimationFrameUrls(config: PetConfig, state: PetState): string[] {
  const animationName = stateToAnimation[state];

  if (!animationName) {
    return [];
  }

  const animation = config.animations[animationName];

  if (!animation) {
    return [];
  }

  if (animation.file) {
    return [`/assets/pets/${config.name}/${animation.file}`];
  }

  const frameCount = animation.frameCount ?? 0;
  const framePrefix = animation.framePrefix ?? animationName;
  const frameExtension = animation.frameExtension ?? "png";
  const framePath = animation.path ?? animationName;
  const frameIndexes = animation.sequence ?? Array.from({ length: frameCount }, (_, index) => index);

  return frameIndexes.map((frameIndex) => {
    const paddedIndex = String(frameIndex).padStart(2, "0");
    return `/assets/pets/${config.name}/${framePath}/${framePrefix}_${paddedIndex}.${frameExtension}`;
  });
}

export function getAnimationFps(config: PetConfig, state: PetState): number {
  const animationName = stateToAnimation[state];

  if (!animationName) {
    return 8;
  }

  return config.animations[animationName]?.fps ?? 8;
}
