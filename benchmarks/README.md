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
