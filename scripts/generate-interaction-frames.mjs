import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const petRoot = join(root, "assets", "pets", "bubu");
const canvas = 256;

const sets = [
  {
    action: "wakeup",
    source: "sleep",
    frames: ["sleep_00.png", "sleep_01.png"],
    overlays: ["morning", "morning"]
  },
  {
    action: "energetic",
    source: "happy",
    frames: ["happy_01.png", "happy_02.png"],
    overlays: ["sparkle", "sparkle"]
  },
  {
    action: "sleepy",
    source: "sleep",
    frames: ["sleep_00.png", "sleep_02.png"],
    overlays: ["sleepy", "sleepy"]
  },
  {
    action: "syncKeyboard",
    source: "think",
    frames: ["think_00.png", "think_01.png", "think_04.png", "think_01.png", "think_04.png", "think_00.png"],
    overlays: ["work-key-0", "work-key-1", "work-key-2", "work-key-3", "work-key-4", "work-key-5"]
  },
  {
    action: "syncMouse",
    source: "think",
    frames: ["think_00.png", "think_01.png", "think_05.png", "think_01.png", "think_04.png", "think_00.png"],
    overlays: ["work-mouse-0", "work-mouse-1", "work-mouse-2", "work-mouse-3", "work-mouse-4", "work-mouse-5"]
  },
  {
    action: "look",
    source: "idle",
    frames: ["idle_00.png", "idle_03.png", "idle_05.png", "idle_03.png", "idle_00.png", "idle_04.png"],
    overlays: ["eyes-right", "eyes-left", "eyes-right", "eyes-left", "eyes-right", "eyes-center"]
  },
  {
    action: "annoyed",
    source: "happy",
    frames: ["happy_00.png", "happy_03.png", "happy_04.png", "happy_03.png", "happy_04.png", "happy_05.png"],
    overlays: ["angry", "angry", "blush", "angry", "blush", "none"]
  },
  {
    action: "drop",
    source: "drag",
    frames: ["drag_05.png", "drag_04.png", "drag_05.png", "drag_04.png", "drag_05.png", "drag_00.png"],
    overlays: ["wobble-left", "wobble-right", "wobble-left", "wobble-right", "none", "none"]
  },
  {
    action: "shy",
    source: "think",
    frames: ["think_00.png", "think_01.png", "think_04.png", "think_01.png", "think_04.png", "think_05.png"],
    overlays: ["blush", "blush", "blush", "blush", "blush", "blush"]
  }
];

for (const set of sets) {
  const outDir = join(petRoot, set.action);
  await mkdir(outDir, { recursive: true });

  for (let index = 0; index < set.frames.length; index += 1) {
    const input = join(petRoot, set.source, set.frames[index]);
    const output = join(outDir, `${set.action}_${String(index).padStart(2, "0")}.png`);
    const overlay = createOverlay(set.overlays[index]);

    await sharp(input)
      .composite(overlay ? [{ input: Buffer.from(overlay), top: 0, left: 0 }] : [])
      .png()
      .toFile(output);
  }

  console.log(`generated ${set.action}`);
}

function createOverlay(kind) {
  if (kind === "none") {
    return "";
  }

  const parts = [];

  if (kind === "eyes-right") {
    parts.push(circle(108, 105, 5, "#2a1a14"), circle(154, 105, 5, "#2a1a14"));
  }

  if (kind === "eyes-left") {
    parts.push(circle(100, 105, 5, "#2a1a14"), circle(146, 105, 5, "#2a1a14"));
  }

  if (kind === "eyes-center") {
    parts.push(circle(104, 104, 5, "#2a1a14"), circle(150, 104, 5, "#2a1a14"));
  }

  if (kind === "morning") {
    parts.push(
      `<circle cx="54" cy="54" r="14" fill="#ffd36b" opacity="0.9"/>`,
      `<path d="M54 24 V36 M54 72 V84 M24 54 H36 M72 54 H84 M34 34 L42 42 M74 34 L66 42" fill="none" stroke="#f4b84a" stroke-width="4" stroke-linecap="round" opacity="0.86"/>`
    );
  }

  if (kind === "sparkle") {
    parts.push(
      `<path d="M64 48 L70 62 L84 68 L70 74 L64 88 L58 74 L44 68 L58 62Z" fill="#ffd86f" opacity="0.9"/>`,
      `<path d="M184 72 L188 82 L198 86 L188 90 L184 100 L180 90 L170 86 L180 82Z" fill="#8fd6ff" opacity="0.9"/>`
    );
  }

  if (kind === "sleepy") {
    parts.push(
      `<path d="M172 54 H198 L174 82 H200" fill="none" stroke="#5b3427" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.72"/>`,
      `<path d="M200 28 H218 L202 48 H220" fill="none" stroke="#5b3427" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.56"/>`
    );
  }

  if (kind.startsWith("work-key-") || kind.startsWith("work-mouse-")) {
    parts.push(workDeskScene(kind));
  }

  if (kind === "keyboard-tap-left" || kind === "keyboard-tap-mid" || kind === "keyboard-tap-right") {
    const offset = kind === "keyboard-tap-left" ? -14 : kind === "keyboard-tap-right" ? 14 : 0;
    const leftPawY = kind === "keyboard-tap-left" ? 171 : 178;
    const rightPawY = kind === "keyboard-tap-right" ? 171 : 178;
    parts.push(
      deskSurface(),
      seatedLegs(offset),
      flowerPad(45, 194),
      keyboard(92, 186, kind),
      arm(72, 154, 86 + offset, leftPawY),
      arm(146, 154, 126 + offset, rightPawY),
      paw(86 + offset, leftPawY, kind === "keyboard-tap-left"),
      paw(126 + offset, rightPawY, kind === "keyboard-tap-right")
    );
  }

  if (kind === "mouse-move-left" || kind === "mouse-move-mid" || kind === "mouse-move-right") {
    const mouseX = kind === "mouse-move-left" ? 42 : kind === "mouse-move-right" ? 68 : 55;
    const bodyOffset = kind === "mouse-move-left" ? -4 : kind === "mouse-move-right" ? 4 : 0;
    parts.push(
      deskSurface(),
      seatedLegs(bodyOffset),
      flowerPad(53, 194),
      keyboard(106, 188, "keyboard-idle"),
      arm(70, 154, mouseX, 175),
      arm(148, 156, 132, 181),
      paw(mouseX, 175, true),
      paw(132, 181, false)
    );
  }

  if (kind === "sweat") {
    parts.push(`<path d="M176 76 C190 92 184 110 170 110 C158 110 158 94 176 76Z" fill="#78c7ee" opacity="0.9"/>`);
  }

  if (kind === "surprise") {
    parts.push(`<text x="186" y="78" fill="#3a241b" font-size="32" font-family="Arial" font-weight="700">!</text>`);
  }

  if (kind === "angry") {
    parts.push(
      `<path d="M82 78 L112 70 L102 88 L130 80" fill="none" stroke="#c94938" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  if (kind === "blush") {
    parts.push(ellipse(84, 132, 18, 10, "#ff8ea1", 0.38), ellipse(172, 132, 18, 10, "#ff8ea1", 0.38));
  }

  if (kind === "wobble-left") {
    parts.push(wobbleMarks(56, 160), wobbleMarks(200, 160));
  }

  if (kind === "wobble-right") {
    parts.push(wobbleMarks(62, 168), wobbleMarks(194, 168));
  }

  return `<svg width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
}

function circle(cx, cy, r, fill) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="0.92"/>`;
}

function ellipse(cx, cy, rx, ry, fill, opacity) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}"/>`;
}

function wobbleMarks(x, y) {
  return `<path d="M${x} ${y - 18} C${x - 10} ${y - 8} ${x - 10} ${y + 8} ${x} ${y + 18}" fill="none" stroke="#5b3427" stroke-width="4" stroke-linecap="round" opacity="0.72"/>`;
}

function deskSurface() {
  return `<path d="M10 168 H246 V238 H10Z" fill="#f8fbff" stroke="#4d3228" stroke-width="5" opacity="0.98"/>
  <path d="M14 168 H242" stroke="#d9e5ea" stroke-width="3" opacity="0.85"/>`;
}

function flowerPad(x, y) {
  const petals = [
    `<ellipse cx="${x - 14}" cy="${y}" rx="10" ry="7" fill="#f7b5c8"/>`,
    `<ellipse cx="${x}" cy="${y - 12}" rx="7" ry="10" fill="#f7b5c8"/>`,
    `<ellipse cx="${x + 14}" cy="${y}" rx="10" ry="7" fill="#f7b5c8"/>`,
    `<ellipse cx="${x}" cy="${y + 12}" rx="7" ry="10" fill="#f7b5c8"/>`
  ];

  return `<g opacity="0.95">${petals.join("")}<circle cx="${x}" cy="${y}" r="8" fill="#ffe3ec" stroke="#d7839e" stroke-width="3"/></g>`;
}

function keyboard(x, y, activeKind = "keyboard-idle") {
  const keys = [];

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const isLeftHit = activeKind === "keyboard-tap-left" && row === 1 && col === 1;
      const isRightHit = activeKind === "keyboard-tap-right" && row === 1 && col === 3;
      const isMidHit = activeKind === "keyboard-tap-mid" && row === 2 && col === 2;
      const fill = isLeftHit || isRightHit || isMidHit ? "#ff7f9f" : (row + col) % 2 === 0 ? "#f3a7bb" : "#d7e6ff";
      const keyY = y + row * 11 + (isLeftHit || isRightHit || isMidHit ? 2 : 0);
      keys.push(`<rect x="${x + col * 16}" y="${keyY}" width="11" height="8" rx="2" fill="${fill}" opacity="0.94"/>`);
    }
  }

  return `<g><rect x="${x - 8}" y="${y - 7}" width="98" height="46" rx="8" fill="#f2f6fb" stroke="#5b3427" stroke-width="4" opacity="0.96"/>${keys.join("")}<rect x="${x + 20}" y="${y + 33}" width="42" height="6" rx="3" fill="#bacbd6" opacity="0.95"/></g>`;
}

function seatedLegs(offset) {
  return `<g opacity="0.96"><path d="M86 ${214 + Math.abs(offset) * 0.1} C102 202 112 202 124 216" fill="none" stroke="#5b3427" stroke-width="5" stroke-linecap="round"/><path d="M132 ${216 - Math.abs(offset) * 0.1} C146 202 158 204 170 218" fill="none" stroke="#5b3427" stroke-width="5" stroke-linecap="round"/><ellipse cx="${103 + offset * 0.2}" cy="219" rx="16" ry="7" fill="#f1c2a1" stroke="#5b3427" stroke-width="3"/><ellipse cx="${153 + offset * 0.2}" cy="219" rx="16" ry="7" fill="#f1c2a1" stroke="#5b3427" stroke-width="3"/></g>`;
}

function arm(fromX, fromY, toX, toY) {
  const controlX = (fromX + toX) / 2;
  const controlY = Math.min(fromY, toY) - 14;
  return `<path d="M${fromX} ${fromY} Q${controlX} ${controlY} ${toX} ${toY}" fill="none" stroke="#5b3427" stroke-width="5" stroke-linecap="round" opacity="0.74"/>`;
}

function paw(x, y, pressed) {
  return `<ellipse cx="${x}" cy="${y}" rx="${pressed ? 17 : 15}" ry="${pressed ? 9 : 10}" fill="#f1c2a1" stroke="#5b3427" stroke-width="3" opacity="0.98"/>`;
}

function workDeskScene(kind) {
  const isMouseFocus = kind.startsWith("work-mouse-");
  const index = Number(kind.slice(kind.lastIndexOf("-") + 1));
  const mousePath = isMouseFocus ? [39, 48, 60, 72, 61, 48] : [43, 50, 57, 64, 57, 50];
  const mouseX = mousePath[index] ?? 52;
  const keyPhases = isMouseFocus ? ["mid", "left", "mid", "right", "mid", "left"] : ["left", "mid", "right", "mid", "left", "rest"];
  const keyPhase = keyPhases[index] ?? "mid";
  const rightPaw = keyboardPawPosition(keyPhase);
  const leftPawY = isMouseFocus && (index === 2 || index === 3) ? 169 : 174;
  const bodyLean = isMouseFocus ? (mouseX - 55) * 0.08 : keyPhase === "left" ? -3 : keyPhase === "right" ? 3 : 0;

  return [
    compactDeskSurface(),
    monitorBack(),
    seatedLegs(bodyLean),
    flowerPad(52, 197),
    mouseDevice(mouseX, 184),
    keyboard(104, 184, `keyboard-tap-${keyPhase}`),
    cable(mouseX, 202, 100, 238),
    arm(70, 153, mouseX, leftPawY),
    arm(148, 153, rightPaw.x, rightPaw.y),
    paw(mouseX, leftPawY, isMouseFocus),
    paw(rightPaw.x, rightPaw.y, keyPhase !== "rest")
  ].join("");
}

function keyboardPawPosition(phase) {
  if (phase === "left") {
    return { x: 118, y: 172 };
  }

  if (phase === "right") {
    return { x: 156, y: 172 };
  }

  if (phase === "rest") {
    return { x: 138, y: 181 };
  }

  return { x: 137, y: 174 };
}

function compactDeskSurface() {
  return `<path d="M8 164 H248 V240 H8Z" fill="#fff4f8" stroke="#4d3228" stroke-width="5" opacity="0.98"/>
  <path d="M14 164 H242" stroke="#f2b5c4" stroke-width="3" opacity="0.9"/>`;
}

function monitorBack() {
  return `<path d="M58 160 C54 116 78 84 128 84 C178 84 202 116 198 160" fill="#65518b" stroke="#4d3228" stroke-width="5" opacity="0.28"/>`;
}

function mouseDevice(x, y) {
  return `<g><ellipse cx="${x}" cy="${y + 8}" rx="26" ry="32" fill="#ffc2d1" stroke="#5b3427" stroke-width="4" opacity="0.97"/>
  <path d="M${x} ${y - 18} V${y + 30}" stroke="#cf7c94" stroke-width="3" stroke-linecap="round"/>
  <rect x="${x - 5}" y="${y - 9}" width="10" height="19" rx="5" fill="#ffe7ee" stroke="#cf7c94" stroke-width="3"/></g>`;
}

function cable(x1, y1, x2, y2) {
  return `<path d="M${x1} ${y1} C${x1 - 14} ${y1 + 18} ${x2 - 22} ${y2 - 12} ${x2} ${y2}" fill="none" stroke="#cf7c94" stroke-width="5" stroke-linecap="round" opacity="0.88"/>
  <path d="M${x1} ${y1} C${x1 - 14} ${y1 + 18} ${x2 - 22} ${y2 - 12} ${x2} ${y2}" fill="none" stroke="#ffe7ee" stroke-width="2" stroke-linecap="round" opacity="0.9"/>`;
}
