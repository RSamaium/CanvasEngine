import { computed, signal, tick } from "canvasengine";

export type DayPhase = "night" | "dawn" | "day" | "dusk";

export interface GameClockOptions {
  /** Starting hour, `0` to `24` (decimals are minutes: `18.5` = 18:30). Default: `8` */
  time?: number;
  /** Starting day number. Default: `1` */
  day?: number;
  /** Game minutes elapsed per real second. Default: `1` (a full day lasts 24 real minutes) */
  speed?: number;
  paused?: boolean;
}

/** Hours at which each phase starts. */
export const DAY_PHASES: { phase: DayPhase; from: number }[] = [
  { phase: "night", from: 0 },
  { phase: "dawn", from: 5 },
  { phase: "day", from: 7.5 },
  { phase: "dusk", from: 17.5 },
  { phase: "night", from: 20.5 },
];

export function phaseAt(hour: number): DayPhase {
  const h = ((hour % 24) + 24) % 24;
  let phase: DayPhase = "night";
  for (const entry of DAY_PHASES) {
    if (h >= entry.from) phase = entry.phase;
  }
  return phase;
}

export function formatClock(hour: number) {
  const total = Math.floor((((hour % 24) + 24) % 24) * 60);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Reactive in-game clock.
 * `time` is the hour of the day (0-24, decimals are minutes) and wraps to the next `day`.
 * Call `advance(deltaMs)` every frame, or use `useGameClock()` inside a component.
 *
 * @example
 * ```ts
 * const clock = createGameClock({ time: 18, speed: 10 })
 * clock.label()  // "18:00"
 * clock.phase()  // "dusk"
 * clock.setSpeed(60) // one game hour per real second
 * ```
 */
export function createGameClock(options: GameClockOptions = {}) {
  const time = signal(((options.time ?? 8) % 24 + 24) % 24);
  const day = signal(options.day ?? 1);
  const speed = signal(options.speed ?? 1);
  const paused = signal(options.paused ?? false);

  const label = computed(() => formatClock(time()));
  const phase = computed(() => phaseAt(time()));
  /** Progress of the day, `0` at midnight to `1` at the next midnight. */
  const progress = computed(() => time() / 24);

  const advance = (deltaMs: number) => {
    if (paused() || !Number.isFinite(deltaMs) || deltaMs <= 0) return;
    const hours = (deltaMs / 1000) * speed() / 60;
    let next = time() + hours;
    if (next >= 24) {
      day.update((value) => value + Math.floor(next / 24));
      next %= 24;
    }
    time.set(next);
  };

  const setTime = (hour: number) => {
    time.set(((hour % 24) + 24) % 24);
  };

  return {
    time,
    day,
    speed,
    paused,
    label,
    phase,
    progress,
    advance,
    setTime,
    setSpeed: (value: number) => speed.set(Math.max(0, value)),
    pause: () => paused.set(true),
    resume: () => paused.set(false),
    togglePause: () => paused.update((value) => !value),
  };
}

export type GameClock = ReturnType<typeof createGameClock>;

/**
 * Creates a game clock advanced automatically by the component ticker.
 * Must be called during a component setup.
 */
export function useGameClock(options: GameClockOptions = {}): GameClock {
  const clock = createGameClock(options);
  tick(({ deltaTime }) => clock.advance(Math.min(deltaTime ?? 16.67, 100)));
  return clock;
}
