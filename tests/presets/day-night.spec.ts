import { describe, expect, test } from "vitest";
import {
  createGameClock,
  formatClock,
  lightLevel,
  phaseAt,
  sampleDayLighting,
} from "../../packages/presets/src/DayNight";

describe("Game clock", () => {
  test("advances with the speed in game minutes per real second", () => {
    const clock = createGameClock({ time: 10, speed: 60 });
    clock.advance(1000);
    expect(clock.time()).toBeCloseTo(11);
    expect(clock.label()).toBe("11:00");
  });

  test("wraps to the next day", () => {
    const clock = createGameClock({ time: 23.5, speed: 60, day: 2 });
    clock.advance(1000);
    expect(clock.day()).toBe(3);
    expect(clock.time()).toBeCloseTo(0.5);
  });

  test("does not advance while paused", () => {
    const clock = createGameClock({ time: 8, speed: 60, paused: true });
    clock.advance(5000);
    expect(clock.time()).toBe(8);
    clock.togglePause();
    clock.advance(1000);
    expect(clock.time()).toBeCloseTo(9);
  });

  test("formats time and phases", () => {
    expect(formatClock(18.5)).toBe("18:30");
    expect(formatClock(24)).toBe("00:00");
    expect(phaseAt(2)).toBe("night");
    expect(phaseAt(6)).toBe("dawn");
    expect(phaseAt(12)).toBe("day");
    expect(phaseAt(19)).toBe("dusk");
    expect(phaseAt(22)).toBe("night");
  });
});

describe("Day lighting", () => {
  test("night is dark, blue and desaturated; noon is neutral", () => {
    const night = sampleDayLighting(1);
    const noon = sampleDayLighting(12);
    expect(night.ambient[2]).toBeGreaterThan(night.ambient[0]);
    expect(night.saturation).toBeLessThan(0.5);
    expect(night.lights).toBe(1);
    expect(noon.ambient[0]).toBeGreaterThan(0.95);
    expect(noon.lights).toBe(0);
  });

  test("interpolates across midnight", () => {
    const beforeMidnight = sampleDayLighting(23.9);
    const afterMidnight = sampleDayLighting(0.1);
    expect(beforeMidnight.ambient[0]).toBeCloseTo(afterMidnight.ambient[0], 2);
  });

  test("street lamps switch on progressively with darkness", () => {
    const lamps = Array.from({ length: 10 }, () => ({ x: 0, y: 0 }));
    const litAt = (darkness: number) =>
      lamps.filter((lamp, index) => lightLevel(lamp, index, 19, darkness, 0) > 0.5).length;
    expect(litAt(0)).toBe(0);
    expect(litAt(0.4)).toBeGreaterThan(0);
    expect(litAt(0.4)).toBeLessThan(10);
    expect(litAt(1)).toBe(10);
  });

  test("scheduled lights follow their own hours, across midnight", () => {
    const window = { x: 0, y: 0, schedule: [19, 1] as [number, number] };
    expect(lightLevel(window, 0, 18, 1, 0)).toBe(0);
    expect(lightLevel(window, 0, 21, 1, 0)).toBe(1);
    expect(lightLevel(window, 0, 0.5, 1, 0)).toBe(1);
    expect(lightLevel(window, 0, 3, 1, 0)).toBe(0);
  });

  test("disabled lights stay off", () => {
    expect(lightLevel({ x: 0, y: 0, enabled: false }, 0, 23, 1, 0)).toBe(0);
  });
});
