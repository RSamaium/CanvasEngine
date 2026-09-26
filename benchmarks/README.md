# CanvasEngine Internal Benchmarks

This directory contains internal-only benchmarks. It is intentionally not part of
`pnpm-workspace.yaml` and must not be published as an npm package.

## Commands

```bash
pnpm bench:reactivity
pnpm bench:render
pnpm bench
pnpm bench:compare
```

Reactivity benchmarks run a bundle of `benchmarks/reactivity/scenarios.ts`
built with esbuild, like the shipped library. Running the sources through tsx
injects a `__name()` helper around every closure, which dominated the profile
(~70% of `createComponent`) and hid the real engine costs.

## Profiling

```bash
pnpm bench:profile                                # all scenarios, medians
pnpm bench:profile teardown,patch-all --cpu       # + V8 CPU profile
pnpm bench:profile loop:track --baseline HEAD     # A/B against a git ref
```

The first argument filters scenarios by name (comma separated substrings).
For each scenario the profiler reports:

- median, p95 and min time per iteration (medians stay usable on a busy machine);
- heap retained per iteration (the script runs with `--expose-gc`);
- instances created but never destroyed, and `onDestroy` calls per iteration
  (catches leaks and subtrees torn down twice);
- with `--cpu`, self time by package and by function, mapped back to the
  TypeScript sources, plus a `.cpuprofile` file to open in Chrome DevTools or
  https://www.speedscope.app.

`--baseline <ref>` bundles the engine sources as they are at that git ref and
runs both versions interleaved (A B B A ...) in the same process, so machine
noise affects them equally. Use it to check an engine change before merging.

Options: `--iterations 200`, `--warmup 20`, `--top 15`.

## Scene Teardown

```bash
pnpm bench:teardown
BENCH_TEARDOWN_CPU=1 pnpm bench:teardown           # + Chrome CPU profiles
BENCH_TEARDOWN_BASELINE=b45180f pnpm bench:teardown # compare with another ref
```

Mounts and unmounts a whole scene (`@if` around characters with a body, a
name and an HP bar, plus a flex HUD) in Chromium, with real Pixi, layout and
compiled templates. For each unmount it reports the synchronous cost of
`showScene.set(false)`, the longest frame until the teardown is over, long
animation frames, the time until nothing is left to destroy and, in deferred
mode, the number and longest duration of teardown chunks.

It compares the engine at `BENCH_TEARDOWN_BASELINE` (default `HEAD`) with the
working tree, in sync and deferred mode. Both sides are production builds of
a git commit (the working tree through `git stash create`, which does not
touch it), and the variants alternate between rounds: serving one side from a
dev server and the other from git showed a ~7% bias on identical code.

Environment variables:

- `BENCH_TEARDOWN_COUNTS=100,300` characters per scene
- `BENCH_TEARDOWN_LAYOUTS=absolute,flex` characters positioned with x / y or laid out with flex
- `BENCH_TEARDOWN_RESET=1` the scene resets game state (HP, lists) in an unmount hook
- `BENCH_TEARDOWN_ROUNDS=3`, `BENCH_TEARDOWN_CYCLES=12`
- `BENCH_TEARDOWN_BUDGET_MS=4` deferred teardown budget per chunk
- `BENCH_TEARDOWN_VARIANTS="baseline,candidate sync"` subset of variants
- `BENCH_TEARDOWN_CPU=1`, `BENCH_TEARDOWN_CPU_COUNT`, `BENCH_TEARDOWN_CPU_TOP`

The system Google Chrome is used when Playwright's Chromium is not installed.

## Output

Reports are written to `benchmarks/results/<suite>/`.

Each report includes:

- performance metrics;
- validity markers such as sample count, relative margin of error, coefficient of variation, dropped frames, and asset readiness;
- an environment fingerprint so render results are only compared against similar machines/runners.

`benchmarks/results/` is ignored by git. Keep official reference files in
`benchmarks/baselines/` when a stable local or CI machine is chosen.

## Render Benchmarks

Render benchmarks launch a Vite app in Chromium through Playwright.

Useful environment variables:

- `BENCH_REACTIVITY_TIME_MS=2000`
- `BENCH_REACTIVITY_WARMUP_MS=1000`
- `BENCH_REACTIVITY_FILTER=loop:track,teardown`
- `BENCH_RENDER_DURATION_MS=10000`
- `BENCH_RENDER_WARMUP_MS=2000`
- `BENCH_RENDER_COUNTS=1000,5000,10000`
- `BENCH_RENDER_RUNNERS=canvasengine,pixijs`
- `BENCH_RENDER_PROFILE=1`
- `BENCH_HEADED=1`

By default render benchmarks run both CanvasEngine and direct PixiJS versions
of the same sprite scenario. The report includes a comparison section where
PixiJS direct is the baseline and CanvasEngine is the candidate.
For `averageFpsRatio`, higher is better. For frame-time and update-time ratios,
lower is better.

`BENCH_RENDER_PROFILE=1` adds per-frame update breakdown metrics to the JSON
report: sprite reference refresh, item access, animation math, Pixi mutations,
and total loop time. Profiling adds measurement overhead and should be used for
diagnosis rather than official baselines.

If Playwright cannot find a browser, run:

```bash
pnpm exec playwright install chromium
```

## Comparing Baselines

By default `pnpm bench:compare` checks:

- `benchmarks/results/reactivity/latest.json` against `benchmarks/baselines/reactivity.json`
- `benchmarks/results/render/latest.json` against `benchmarks/baselines/render.json`

You can also compare explicit files:

```bash
pnpm bench:compare -- --current benchmarks/results/render/latest.json --baseline benchmarks/baselines/render.json --threshold 0.15
```
