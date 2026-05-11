const params = new URLSearchParams(window.location.search);
const runner = params.get("runner") ?? "canvasengine";

try {
  if (runner === "pixijs") {
    const { runPixiDirectBenchmark } = await import("./pixi-direct");
    await runPixiDirectBenchmark(document.getElementById("root"));
  } else {
    const [{ bootstrapCanvas }, { default: App }] = await Promise.all([
      import("canvasengine"),
      import("./render-benchmark.ce"),
    ]);

    await bootstrapCanvas(document.getElementById("root"), App, {
      width: 1280,
      height: 720,
      resolution: 1,
      antialias: false,
      preference: "webgl",
    });
  }
} catch (error) {
  window.__CANVASENGINE_BENCHMARK_ERROR__ = String(error?.stack ?? error);
  throw error;
}

declare global {
  interface Window {
    __CANVASENGINE_BENCHMARK_RESULT__?: unknown;
    __CANVASENGINE_BENCHMARK_ERROR__?: string;
  }
}
