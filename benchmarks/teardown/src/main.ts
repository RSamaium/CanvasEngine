/**
 * Mounts and unmounts a whole scene `cycles` times and measures, for each
 * unmount: the synchronous cost of `showScene.set(false)`, the longest frame
 * until the teardown is over, and the time until nothing is left to destroy.
 */
const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") ?? "sync";
const cycles = Number(params.get("cycles") ?? 12);
const warmupCycles = Number(params.get("warmupCycles") ?? 2);
const budgetMs = Number(params.get("budgetMs") ?? 4);

type LongFrame = { startTime: number; duration: number; blockingDuration?: number };

// Deferred teardown runs in idle callbacks: time each one to report the
// longest chunk (Chromium has requestIdleCallback; nothing else here uses it)
const idleChunks: number[] = [];
const nativeRequestIdle = window.requestIdleCallback?.bind(window);
if (nativeRequestIdle) {
  window.requestIdleCallback = (callback, options) =>
    nativeRequestIdle((deadline) => {
      const start = performance.now();
      callback(deadline);
      idleChunks.push(performance.now() - start);
    }, options);
}

const afterMicrotasks = () =>
  new Promise<void>((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(null);
  });

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));

async function run() {
  const engine: any = await import("canvasengine");
  if (mode === "deferred") {
    if (typeof engine.configureTeardown !== "function") {
      throw new Error("This engine version has no configureTeardown()");
    }
    engine.configureTeardown({ deferred: true, budgetMs });
  }

  const [{ default: Scene }, { showScene, resetState }] = await Promise.all([
    import("./scene.ce"),
    import("./state"),
  ]);

  await engine.bootstrapCanvas(document.getElementById("root"), Scene, {
    width: 1280,
    height: 720,
    resolution: 1,
    antialias: false,
    preference: "webgl",
  });

  const longFrames: LongFrame[] = [];
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as LongFrame[]) longFrames.push(entry);
    }).observe({ type: "long-animation-frame", buffered: false });
  } catch {
    // long-animation-frame is Chromium only
  }

  const pending = () => engine.pendingTeardownCount?.() ?? 0;
  const samples = [];

  for (let cycle = 0; cycle < cycles + warmupCycles; cycle++) {
    resetState();
    const mountStart = performance.now();
    showScene.set(true);
    // Mounting continues in microtasks: a message event runs once they are done
    await afterMicrotasks();
    const mountMs = performance.now() - mountStart;
    for (let frame = 0; frame < 10; frame++) await nextFrame();

    await nextFrame();
    idleChunks.length = 0;
    const profiling = cycle >= warmupCycles && window.__teardownProfiler;
    if (profiling) await window.__teardownProfiler!("start");
    const start = performance.now();
    showScene.set(false);
    const syncMs = performance.now() - start;
    // Sync teardown: profile the blocking call only, not the frames after
    if (profiling && mode === "sync") await window.__teardownProfiler!("stop");

    let last = start;
    let longestFrameMs = 0;
    let frames = 0;
    while (frames < 600) {
      await nextFrame();
      const time = performance.now();
      longestFrameMs = Math.max(longestFrameMs, time - last);
      last = time;
      frames++;
      if (frames >= 3 && pending() === 0) break;
    }

    if (profiling && mode !== "sync") await window.__teardownProfiler!("stop");

    const loafs = longFrames.filter((entry) => entry.startTime + entry.duration >= start && entry.startTime <= last);
    if (cycle >= warmupCycles) {
      samples.push({
        mountMs,
        syncMs,
        longestFrameMs,
        drainedMs: last - start,
        longAnimationFrameMs: Math.max(0, ...loafs.map((entry) => entry.duration)),
        blockingMs: loafs.reduce((sum, entry) => sum + (entry.blockingDuration ?? 0), 0),
        longestChunkMs: Math.max(0, ...idleChunks),
        chunks: idleChunks.length,
      });
    }
  }

  window.__TEARDOWN_RESULT__ = { mode, samples };
}

run().catch((error) => {
  window.__TEARDOWN_ERROR__ = String(error?.stack ?? error);
});

declare global {
  interface Window {
    __TEARDOWN_RESULT__?: unknown;
    __TEARDOWN_ERROR__?: string;
    /** Set by the runner when profiling: CPU profile of each teardown only. */
    __teardownProfiler?: (action: "start" | "stop") => Promise<void>;
  }
}
