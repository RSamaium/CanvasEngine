import { expect, test, type Page } from "@playwright/test";

const cases = [
  "canvas-root",
  "alignments",
  "spacing-border",
  "responsive",
  "absolute-overlay",
  "reactive",
  "dynamic-tree",
  "transforms",
] as const;

async function openStableCase(
  page: Page,
  layoutCase: string,
  state = "default",
) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(
    `/?example=layout-validation&case=${layoutCase}&state=${state}&visual=1`,
  );
  await page.waitForFunction(
    () => (globalThis as any).__CANVASENGINE_LAYOUT_SAMPLE_READY__ === true,
  );
  await expect(page.locator("#root canvas")).toBeVisible();
  // Text measurement and the resulting intrinsic Yoga sizes settle on the
  // frames following the first paint. Capture only after that propagation.
  await page.waitForTimeout(250);
  expect(errors).toEqual([]);
}

async function expectCanvasScreenshot(page: Page, name: string) {
  const screenshot = await page.locator("#root canvas").screenshot({
    animations: "disabled",
  });
  expect(screenshot).toMatchSnapshot(name, {
    threshold: 0.2,
    maxDiffPixelRatio: 0.002,
  });
}

for (const layoutCase of cases) {
  test(`${layoutCase} matches its visual reference`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openStableCase(page, layoutCase);
    await expectCanvasScreenshot(page, `${layoutCase}.png`);
  });
}

for (const layoutCase of ["reactive", "dynamic-tree"] as const) {
  test(`${layoutCase} compact state matches its visual reference`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openStableCase(page, layoutCase, "compact");
    await expectCanvasScreenshot(page, `${layoutCase}-compact.png`);
  });
}

for (const viewport of [
  { name: "small", width: 1024, height: 768 },
  { name: "large", width: 1600, height: 900 },
] as const) {
  test(`responsive layout matches at ${viewport.name} viewport`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openStableCase(page, "responsive");
    await expectCanvasScreenshot(page, `responsive-${viewport.name}.png`);
  });
}

test("dialog body text remains readable", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?example=box");
  await expect(page.locator("#root canvas")).toBeVisible();
  await page.waitForTimeout(900);

  const metrics = await page.evaluate(() => {
    const stack = [(globalThis as any).__PIXI_STAGE__];
    while (stack.length) {
      const current = stack.pop();
      if (
        typeof current?.text === "string" &&
        current.text.startsWith("The old road")
      ) {
        return {
          fontSize: current.style.fontSize,
          layoutWidth: current.layout.computedLayout.width,
          objectFit: current.layout.style.objectFit,
          contentWidth: current.parent.layout.computedLayout.width,
          containingBlockWidth: current.parent.parent.layout.computedLayout.width,
          worldScaleX: Math.hypot(
            current.worldTransform.a,
            current.worldTransform.b,
          ),
        };
      }
      stack.push(...(current?.children ?? []));
    }
    throw new Error("Dialog body text was not found");
  });

  expect(errors).toEqual([]);
  expect(metrics.fontSize).toBe(18);
  expect(metrics.objectFit).toBe("none");
  expect(metrics.layoutWidth).toBeGreaterThan(600);
  expect(metrics.contentWidth).toBeGreaterThan(600);
  expect(metrics.containingBlockWidth).toBe(720);
  expect(metrics.worldScaleX).toBeCloseTo(1, 4);
  await expectCanvasScreenshot(page, "dialog-box.png");
});

test("dialog layout remains readable at a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 720 });
  await page.goto("/?example=box");
  await expect(page.locator("#root canvas")).toBeVisible();
  await page.waitForTimeout(900);

  const metrics = await page.evaluate(() => {
    const stack = [(globalThis as any).__PIXI_STAGE__];
    while (stack.length) {
      const current = stack.pop();
      if (
        typeof current?.text === "string" &&
        current.text.startsWith("The old road")
      ) {
        return {
          layoutWidth: current.layout.computedLayout.width,
          objectFit: current.layout.style.objectFit,
          containingBlockWidth: current.parent.parent.layout.computedLayout.width,
          worldScaleX: Math.hypot(
            current.worldTransform.a,
            current.worldTransform.b,
          ),
        };
      }
      stack.push(...(current?.children ?? []));
    }
    throw new Error("Dialog body text was not found");
  });

  expect(metrics.layoutWidth).toBe(218);
  expect(metrics.containingBlockWidth).toBe(280);
  expect(metrics.objectFit).toBe("none");
  expect(metrics.worldScaleX).toBeCloseTo(1, 4);
  await expectCanvasScreenshot(page, "dialog-box-narrow.png");
});
