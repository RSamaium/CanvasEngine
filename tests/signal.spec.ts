import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Effect, computed, effect, signal } from "../packages/engine/signal";

describe("Writable Signal", () => {
  it("returns the current value when called as a function", () => {
    const numSignal = signal(10);
    expect(numSignal()).toBe(10);
  });

  it("updates the value with set()", () => {
    const numSignal = signal(10);
    numSignal.set(20);
    expect(numSignal()).toBe(20);
  });

  it("updates the value with update()", () => {
    const numSignal = signal(10);
    numSignal.update((n) => n + 5);
    expect(numSignal()).toBe(15);
  });

  it("modifies the value with mutate()", () => {
    const listSignal = signal([1, 2, 3]);
    listSignal.mutate((arr) => arr.push(4));
    expect(listSignal()).toEqual([1, 2, 3, 4]);
  });
});

describe("Writable Array Signal", () => {
  it("returns the current array when called as a function", () => {
    const listSignal = signal([1, 2, 3]);
    expect(listSignal()).toEqual([1, 2, 3]);
  });

  it("updates the array with set()", () => {
    const listSignal = signal([1, 2, 3]);
    listSignal.set([4, 5, 6]);
    expect(listSignal()).toEqual([4, 5, 6]);
  });

  it("updates the array with update()", () => {
    const listSignal = signal([1, 2, 3]);
    listSignal.update((arr) => arr.map((n) => n * 2));
    expect(listSignal()).toEqual([2, 4, 6]);
  });

  it("modifies the array with mutate()", () => {
    const listSignal = signal([1, 2, 3]);
    listSignal.mutate((arr) => arr.push(4, 5));
    expect(listSignal()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("Computed Signal", () => {
  let numSignal1, numSignal2, computedSum;

  beforeEach(() => {
    numSignal1 = signal(5);
    numSignal2 = signal(10);
    computedSum = computed(() => numSignal1() + numSignal2());
  });

  it("correctly computes the initial value", () => {
    expect(computedSum()).toBe(15);
  });

  it("updates when dependencies change", () => {
    // Modifie les signaux dépendants et vérifie que le signal calculé est mis à jour
    numSignal1.set(10);
    numSignal2.set(20);
    expect(computedSum()).toBe(30);
  });

  it("does not update when dependencies are set to their current value", () => {
    let initialComputationCount = 0;
    const testComputed = computed(() => {
      initialComputationCount++;
      return numSignal1() + numSignal2();
    });

    numSignal1.set(5);
    numSignal2.set(10);

    expect(testComputed()).toBe(15);
    expect(initialComputationCount).toBe(3);
  });

  it("correctly updates with multiple dependencies", () => {
    const numSignal3 = signal(5);
    const computedProduct = computed(
      () => numSignal1() * numSignal2() * numSignal3()
    );

    numSignal1.set(2);
    numSignal2.set(3);
    numSignal3.set(4);

    expect(computedProduct()).toBe(24);
  });
});

describe("Reactive Effect", () => {
  let numSignal, effectSpy;

  beforeEach(() => {
    numSignal = signal(0);
    effectSpy = vi.fn();
  });

  afterEach(() => {
    effectSpy.mockReset();
  });

  it("calls the effect function initially", () => {
    effect(() => {
      effectSpy(numSignal());
    });

    expect(effectSpy).toHaveBeenCalledTimes(1);
    expect(effectSpy).toHaveBeenCalledWith(0);
  });

  it("calls the effect function when the dependency changes", () => {
    effect(() => {
      effectSpy(numSignal());
    });

    numSignal.set(10);

    expect(effectSpy).toHaveBeenCalledTimes(2);
    expect(effectSpy).toHaveBeenCalledWith(10);
  });

  it("call effect with array", () => {
    const arrayNb = signal([1, 2, 3]);

    effect(() => {
      effectSpy(arrayNb());
    });

    arrayNb().push(4);
    arrayNb().push(5);

    expect(effectSpy).toHaveBeenCalledTimes(3);
    expect(effectSpy).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
  });

  it("call effect with array, use mutate()", () => {
    const arrayNb = signal([1, 2, 3]);

    effect(() => {
      effectSpy(arrayNb());
    });

    arrayNb.mutate((arr) => arr.push(4))
    arrayNb.mutate((arr) => arr.push(5))

    expect(effectSpy).toHaveBeenCalledTimes(3);
    expect(effectSpy).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
  });

  it("call effect with array, use getter", () => {
    const arrayNb = signal([1, 2, 3]);

    effect(() => {
      effectSpy(arrayNb());
    });

    arrayNb().find((n) => n === 2);

    expect(effectSpy).toHaveBeenCalledTimes(1);
  });

  describe("Effect Cleanup", () => {
    let numSignal, cleanupSpy, _effect: Effect;

    beforeEach(() => {
      numSignal = signal(0);
      cleanupSpy = vi.fn();
    });

    afterEach(() => {
      // Nettoyage
      cleanupSpy.mockReset();
    });

    it("initially subscribes to the computed observable", () => {
      _effect = effect(() => {
        numSignal();
        return cleanupSpy;
      });

      expect(_effect.subscription.closed).toBeFalsy();
    });

    it("calls cleanup function upon effect unsubscription", () => {
      _effect = effect(() => {
        numSignal();
        return cleanupSpy;
      });

      _effect.subscription.unsubscribe();

      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(_effect.subscription.closed).toBeTruthy();
    });

    it("effect does not react after unsubscription", () => {
      const effectReactionSpy = vi.fn();
      _effect = effect(() => {
        effectReactionSpy(numSignal());
        return cleanupSpy;
      });
      _effect.subscription.unsubscribe();
      numSignal.set(10);
      expect(effectReactionSpy).toHaveBeenCalledTimes(1);
    });
  });
});
