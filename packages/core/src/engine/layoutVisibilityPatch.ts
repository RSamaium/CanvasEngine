import { Container } from "pixi.js";

const PATCHED = Symbol.for("canvasengine.layoutVisibilityPatch");

/**
 * Stops `@pixi/layout` from redefining `Container.prototype.visible` on every
 * layout creation.
 *
 * The `layout` setter of `@pixi/layout` installs a `visible` accessor on
 * `Container.prototype` each time a container gets a layout, and restores the
 * original accessor each time one is removed. Every redefinition of a shared
 * prototype property invalidates V8's inline caches for all containers: in a
 * flex scene of 1000 items it made mounting ~3x slower (811 ms vs 286 ms).
 *
 * Every hook it installs behaves the same, so a redefinition is skipped when
 * the accessor in place already has the same behaviour: a layout hook over a
 * layout hook, or the original accessor over the original accessor. The
 * interception only applies while the `layout` setter runs.
 *
 * Must run after `@pixi/layout` is imported, before any layout is created.
 */
export function installLayoutVisibilityPatch() {
  const proto = Container.prototype as any;
  const layoutDescriptor = Object.getOwnPropertyDescriptor(proto, "layout");
  const originalSet = layoutDescriptor?.set;
  if (!layoutDescriptor || !originalSet || (originalSet as any)[PATCHED]) return;

  const originalVisible = Object.getOwnPropertyDescriptor(proto, "visible");
  if (!originalVisible) return;

  // The accessor currently in place: the original one, or a layout hook
  let visibleIsHook = false;
  const define = Object.defineProperty;

  const guardedDefine = function (target: any, key: PropertyKey, descriptor: PropertyDescriptor) {
    if (target === proto && key === "visible") {
      const installsOriginal = descriptor.set === originalVisible.set;
      if (installsOriginal ? !visibleIsHook : visibleIsHook) {
        return target;
      }
      visibleIsHook = !installsOriginal;
    }
    return define(target, key, descriptor);
  } as typeof Object.defineProperty;

  const set = function (this: any, value: any) {
    Object.defineProperty = guardedDefine;
    try {
      originalSet.call(this, value);
    } finally {
      Object.defineProperty = define;
    }
  };
  (set as any)[PATCHED] = true;

  define(proto, "layout", { ...layoutDescriptor, set });
}
