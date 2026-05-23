import { access, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDir = join(projectRoot, "assets", "source-sheets", "bubu");
const outputRoot = join(projectRoot, "assets", "pets", "bubu");

const sheets = [
  {
    action: "idle",
    file: "a_clean_digital_illustration_sprite_sheet_style_1.png"
  },
  {
    action: "happy",
    file: "a_clean_illustration_comic_style_sprite_sheet_a_t_2_batch_1.png"
  },
  {
    action: "think",
    file: "a_clean_flat_vector_sprite_sheet_sticker_shee_3_batch_2.png"
  },
  {
    action: "sleep",
    file: "a_clean_png_style_illustration_on_a_transparent_ch_4_batch_3.png"
  },
  {
    action: "talk",
    file: "a_clean_flat_digital_illustration_sprite_sheet_5_batch_4.png"
  },
  {
    action: "drag",
    file: "a_clean_cute_sticker_sheet_style_illustration_6_batch_5.png"
  }
];

const xs = [0, 483, 965, 1448];
const ys = [0, 543, 1086];
const canvasSize = 256;
const trimThreshold = 18;
const transparentThreshold = 232;

for (const sheet of sheets) {
  const input = join(sourceDir, sheet.file);
  await assertExists(input);
  const actionDir = join(outputRoot, sheet.action);
  await mkdir(actionDir, { recursive: true });

  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const frameIndex = row * 3 + column;
      const left = xs[column];
      const top = ys[row];
      const width = xs[column + 1] - left;
      const height = ys[row + 1] - top;
      const output = join(actionDir, `${sheet.action}_${String(frameIndex).padStart(2, "0")}.png`);

      await sharp(input)
        .extract({ left, top, width, height })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(({ data, info }) => {
          makeConnectedBackgroundTransparent(data, info.width, info.height);
          const bounds = findOpaqueBounds(data, info.width, info.height);

          if (!bounds) {
            return sharp({
              create: {
                width: canvasSize,
                height: canvasSize,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
              }
            }).png().toFile(output);
          }

          const frameWidth = bounds.right - bounds.left + 1;
          const frameHeight = bounds.bottom - bounds.top + 1;

          return sharp(data, {
            raw: {
              width: info.width,
              height: info.height,
              channels: 4
            }
          })
            .extract({
              left: bounds.left,
              top: bounds.top,
              width: frameWidth,
              height: frameHeight
            })
            .resize({
              width: canvasSize,
              height: canvasSize,
              fit: "contain",
              withoutEnlargement: false,
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .extend({
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(output);
        });
    }
  }

  console.log(`sliced ${sheet.action}`);
}

function makeConnectedBackgroundTransparent(data, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x += 1) {
    pushIfBackground(x, 0);
    pushIfBackground(x, height - 1);
  }

  for (let y = 1; y < height - 1; y += 1) {
    pushIfBackground(0, y);
    pushIfBackground(width - 1, y);
  }

  while (queue.length > 0) {
    const index = queue.pop();
    const x = index % width;
    const y = Math.floor(index / width);
    const offset = index * 4;
    data[offset + 3] = 0;

    if (x > 0) {
      pushIfBackground(x - 1, y);
    }
    if (x < width - 1) {
      pushIfBackground(x + 1, y);
    }
    if (y > 0) {
      pushIfBackground(x, y - 1);
    }
    if (y < height - 1) {
      pushIfBackground(x, y + 1);
    }
  }

  function pushIfBackground(x, y) {
    const index = y * width + x;

    if (visited[index]) {
      return;
    }

    visited[index] = 1;

    if (isBackgroundPixel(index * 4)) {
      queue.push(index);
    }
  }

  function isBackgroundPixel(offset) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);

    return max >= transparentThreshold && max - min <= 10;
  }
}

function findOpaqueBounds(data, width, height) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];

      if (alpha > trimThreshold) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  if (right < left || bottom < top) {
    return null;
  }

  return {
    left: Math.max(0, left - 8),
    top: Math.max(0, top - 8),
    right: Math.min(width - 1, right + 8),
    bottom: Math.min(height - 1, bottom + 8)
  };
}

async function assertExists(path) {
  try {
    await access(path);
  } catch {
    const relative = path.replace(projectRoot, "").replace(/^[\\/]/, "");
    throw new Error(`Missing source sheet: ${relative}`);
  }
}
