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
