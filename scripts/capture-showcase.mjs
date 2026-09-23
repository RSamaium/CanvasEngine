/**
 * Captures the screenshots used on the documentation home page.
 *
 * 1. Start the sample app: `pnpm --dir sample dev --port 5199`
 * 2. Run: `node scripts/capture-showcase.mjs [http://localhost:5199]`
 *
 * Images are written to docs/public/showcase/*.png (convert to webp afterwards).
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:5199";
const OUT = new URL("../docs/public/showcase/", import.meta.url).pathname;

// Runs in the page: helpers to stage a shot
const stageHelpers = () => {
  const stage = globalThis.__PIXI_STAGE__;
  const all = [];
  const walk = (node) => {
    all.push(node);
    node.children?.forEach(walk);
  };
  walk(stage);
  const viewport = all.find((node) => typeof node.setZoom === "function");
  return {
    all,
    viewport,
    hideUi(minZ = 30) {
      const root = stage.children[0];
      for (const child of root?.children ?? []) {
        if ((child.zIndex ?? 0) >= minZ) child.renderable = false;
      }
    },
    frame(x, y, zoom) {
      if (!viewport) return;
      viewport.plugins?.remove?.("follow");
      viewport.setZoom(zoom, true);
      viewport.moveCenter(x, y);
    },
    tapText(label) {
      const text = all.find((node) => node.text === label);
      text?.emit?.("pointertap", {});
    },
  };
};

const showcase = (scene, x, y, zoom, extra = {}) => ({
  name: scene,
  url: `?example=showcase&scene=${scene}`,
  wait: 4500,
  stage: `h.frame(${x}, ${y}, ${zoom}); ${extra.fx ? "globalThis.__playShowcaseFx();" : ""}`,
  after: extra.after ?? 800,
});

const shots = [
  showcase("town-night", 960, 820, 1.15),
  showcase("town-dusk", 960, 820, 1.15),
  showcase("town-autumn", 960, 880, 1.3),
  showcase("town-snow", 960, 880, 1.3),
  showcase("forest-rays", 1030, 1230, 1.35),
  showcase("forest-embers", 1030, 1230, 1.35),
  showcase("beach-clouds", 1150, 640, 0.95),
  showcase("fx-limit", 960, 880, 1.25, { fx: true, after: 170 }),
  showcase("fx-holy", 1060, 1200, 1.25, { fx: true, after: 520 }),
  showcase("fx-crystal", 1060, 880, 1.4, { fx: true, after: 260 }),
  showcase("fx-sigil", 820, 560, 1.5, { fx: true, after: 900 }),
  {
    name: "beach",
    url: "?example=beach",
    wait: 11000,
    stage: `h.hideUi(100); h.frame(1260, 640, 1.3);`,
  },
  {
    name: "shadows",
    url: "?example=sprite-shadows",
    wait: 4000,
    stage: `h.hideUi(100); h.frame(1030, 1230, 1.5);`,
  },
  {
    name: "footprints",
    url: "?example=footprints",
    wait: 9000,
    stage: `h.hideUi(100); const cat = h.all.find((n) => n.texture && n.texture.width === 51); h.frame(cat.x - 40, cat.y - 20, 2.2);`,
  },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-gl=angle"] });
const only = process.env.SHOT;

for (const shot of shots) {
  if (only && shot.name !== only) continue;
  const page = await browser.newPage({ viewport: { width: 1520, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/${shot.url}`);
  await page.waitForFunction(() => Boolean(globalThis.__PIXI_STAGE__), null, { timeout: 20000 });
  await page.waitForTimeout(shot.wait);
  await page.evaluate(`(() => { const h = (${stageHelpers.toString()})(); ${shot.stage} })()`);
  await page.waitForTimeout(shot.after ?? 600);
  const canvas = page.locator("#root canvas").first();
  await canvas.screenshot({ path: `${OUT}${shot.name}.png` });
  console.log("captured", shot.name);
  await page.close();
}

await browser.close();
