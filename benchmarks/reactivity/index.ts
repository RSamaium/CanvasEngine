import { Bench } from "tinybench";
import { computed, effect, signal } from "../../packages/core/node_modules/@signe/reactive/dist/index.js";
import {
  createComponent,
  destroyElement,
  loop,
  registerComponent,
  type Element,
} from "../../packages/core/src/engine/reactive";
import {
  coefficientOfVariation,
  formatSummary,
  getEnvironment,
  roundMetric,
  writeReport,
  type BenchmarkReport,
  type ValidityMarker,
} from "../shared/report";

class BenchDisplayObject {
  children: BenchDisplayObject[] = [];
  parent: BenchDisplayObject | null = null;
  text = "";
  x = 0;
  y = 0;

  onInit(props: Record<string, unknown>) {
    Object.assign(this, props);
  }

  onUpdate(props: Record<string, unknown>) {
    Object.assign(this, props);
  }

  onMount(element: Element, index?: number) {
    const parent = element.parent?.componentInstance as BenchDisplayObject | undefined;
    if (!parent) return;
    this.parent = parent;
    if (index === undefined || index < 0 || index >= parent.children.length) {
      parent.children.push(this);
    } else {
      parent.children.splice(index, 0, this);
    }
  }

  onDestroy() {
    if (!this.parent) return;
    const index = this.parent.children.indexOf(this);
    if (index >= 0) {
      this.parent.children.splice(index, 1);
    }
    this.parent = null;
  }
}

registerComponent("BenchContainer", BenchDisplayObject);
registerComponent("BenchText", BenchDisplayObject);

const time = Number(process.env.BENCH_REACTIVITY_TIME_MS ?? 2000);
const warmupTime = Number(process.env.BENCH_REACTIVITY_WARMUP_MS ?? 1000);

const bench = new Bench({
  time,
  warmupTime,
});

bench
  .add("signals:create:1000", () => {
    const signals = Array.from({ length: 1000 }, (_, index) => signal(index));
    let total = 0;
    for (const value of signals) {
      total += value();
    }
    if (total < 0) throw new Error("unreachable");
  })
  .add("signals:computed-chain:1000-updates", () => {
    const source = signal(0);
    const doubled = computed(() => source() * 2);
    const tripled = computed(() => doubled() * 3);
    let current = 0;
    const subscription = effect(() => {
      current = tripled();
    });

    for (let index = 0; index < 1000; index++) {
      source.set(index);
    }

    subscription.subscription.unsubscribe();
    if (current < 0) throw new Error("unreachable");
  })
  .add("components:prop-update:1000", () => {
    const values = Array.from({ length: 1000 }, (_, index) => signal(`item-${index}`));
    const elements = values.map((value) => createComponent("BenchText", { text: value }));

    for (let index = 0; index < values.length; index++) {
      values[index].set(`updated-${index}`);
    }

    destroyElement(elements);
  })
  .add("loop:initial:1000", () => {
    const items = signal(Array.from({ length: 1000 }, (_, index) => index));
    const subscription = loop(items, (item) =>
      createComponent("BenchText", { text: `item-${item}` })
    ).subscribe();

    subscription.unsubscribe();
  })
  .add("loop:append-remove:1000", () => {
    const items = signal(Array.from({ length: 1000 }, (_, index) => index));
    const subscription = loop(items, (item) =>
      createComponent("BenchText", { text: `item-${item}` })
    ).subscribe();

    for (let index = 0; index < 100; index++) {
      items().push(1000 + index);
    }
    for (let index = 0; index < 100; index++) {
      items().splice(items().length - 1, 1);
    }

    subscription.unsubscribe();
  });

function getValidity(result: NonNullable<(typeof bench.tasks)[number]["result"]>): ValidityMarker {
  const samples = result.samples ?? [];
  const cv = coefficientOfVariation(samples);
  const reasons: string[] = [];

  if (samples.length < 30) {
    reasons.push("sample-count-low");
  }
  if (result.rme > 10) {
    reasons.push("relative-margin-of-error-high");
  }
  if (cv > 0.5) {
    reasons.push("coefficient-of-variation-high");
  }

  return {
    valid: reasons.length === 0,
    reasons,
    sampleCount: samples.length,
    relativeMarginOfError: roundMetric(result.rme, 4),
    coefficientOfVariation: roundMetric(cv, 4),
    warmupStable: true,
  };
}

await bench.run();

const report: BenchmarkReport = {
  suite: "reactivity",
  generatedAt: new Date().toISOString(),
  environment: getEnvironment({
    runner: "tinybench",
    time,
    warmupTime,
  }),
  benchmarks: bench.tasks.map((task) => {
    const result = task.result!;
    return {
      name: task.name,
      metrics: {
        hz: roundMetric(result.hz, 2),
        meanMs: roundMetric(result.mean, 6),
        minMs: roundMetric(result.min, 6),
        maxMs: roundMetric(result.max, 6),
        p75Ms: roundMetric(result.p75, 6),
        p99Ms: roundMetric(result.p99, 6),
        rme: roundMetric(result.rme, 4),
        sampleCount: result.samples.length,
      },
      validity: getValidity(result),
    };
  }),
};

const reportPath = await writeReport(report);
console.log(formatSummary(report));
console.log(`Report written to ${reportPath}`);
