import { expect, test, type Page } from "@playwright/test";

async function emitPixiControl(page: Page, label: string) {
  const activated = await page.evaluate((targetLabel) => {
    const stack = [(globalThis as any).__PIXI_STAGE__];
    while (stack.length) {
      const current = stack.pop();
      if (current?.text === targetLabel) {
        current.parent.emit("pointertap", { type: "pointertap" });
        return true;
      }
      stack.push(...(current?.children ?? []));
    }
    return false;
  }, label);

  expect(activated, `Pixi control ${label} should exist`).toBe(true);
  await page.waitForTimeout(60);
}

async function expectActivePreset(page: Page, label: string) {
  const matches = await page.evaluate((targetLabel) => {
    const stack = [(globalThis as any).__PIXI_STAGE__];
    let count = 0;
    while (stack.length) {
      const current = stack.pop();
      if (current?.text === targetLabel) count++;
      stack.push(...(current?.children ?? []));
    }
    return count;
  }, label);

  // The active preset appears in the information card and the control panel.
  expect(matches).toBe(2);
}

async function expectWeatherRenderer(page: Page, renderer: "rain" | "mesh") {
  const state = await page.evaluate(() => {
    const stack = [(globalThis as any).__PIXI_STAGE__];
    let meshCount = 0;
    let rainLayerCount = 0;
    let rainImpactCount = 0;
    while (stack.length) {
      const current = stack.pop();
      if (current?.geometry && current?.shader) meshCount++;
      if (current?.constructor?.name === "RainTextureLayer") rainLayerCount++;
      if (current?.constructor?.name === "RainImpactLayer") rainImpactCount++;
      stack.push(...(current?.children ?? []));
    }
    return { meshCount, rainLayerCount, rainImpactCount };
  });

  if (renderer === "rain") {
    expect(state).toEqual({ meshCount: 0, rainLayerCount: 3, rainImpactCount: 1 });
  } else {
    expect(state.meshCount).toBe(1);
    expect(state.rainLayerCount).toBe(0);
    expect(state.rainImpactCount).toBe(0);
  }
}

test("weather sample exposes every built-in preset", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?example=weather");
  await expect(page.locator("#root canvas")).toBeVisible();
  await page.waitForTimeout(700);

  await expectActivePreset(page, "Steady Rain");
  await expectWeatherRenderer(page, "rain");
  for (const label of ["Storm Rain", "Light Rain", "Steady Rain"]) {
    await emitPixiControl(page, "NEXT  ›");
    await expectActivePreset(page, label);
  }

  await emitPixiControl(page, "SNOW · 3");
  await expectWeatherRenderer(page, "mesh");
  await expectActivePreset(page, "Light Snow");
  for (const label of ["Winter Snow", "Blizzard"]) {
    await emitPixiControl(page, "NEXT  ›");
    await expectActivePreset(page, label);
  }

  await emitPixiControl(page, "FOG · 5");
  await expectWeatherRenderer(page, "mesh");
  await expectActivePreset(page, "Morning Mist");
  for (const label of ["Forest Fog", "Swamp Fog", "Night Fog", "Heavy Fog"]) {
    await emitPixiControl(page, "NEXT  ›");
    await expectActivePreset(page, label);
  }

  await emitPixiControl(page, "CLOUD · 8");
  await expectWeatherRenderer(page, "mesh");
  await expectActivePreset(page, "Light Clouds");
  for (const label of [
    "Overcast",
    "Storm Clouds",
    "Golden Hour",
    "Sunny Soft Rays",
    "Sunset Twinkle",
    "Crepuscular Rays",
    "Morning Haze",
  ]) {
    await emitPixiControl(page, "NEXT  ›");
    await expectActivePreset(page, label);
  }

  expect(errors).toEqual([]);
});
