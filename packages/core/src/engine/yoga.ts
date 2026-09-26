/**
 * Makes sure Yoga is loaded before any CanvasEngine component sets `layout`.
 *
 * Yoga is normally loaded by the `LayoutSystem` of `@pixi/layout` during
 * `Application.init()`. When that system is not run by the application (for
 * example when the bundler loads two copies of `pixi.js` and the extension is
 * registered in the other one), `getYoga()` stays undefined and the first
 * `layout` assignment crashes on `getYoga().Node.create()`.
 *
 * Loading it here is safe: components are created after `Application.init()`,
 * so if the `LayoutSystem` does run and replaces this instance, no layout node
 * exists yet.
 *
 * @example
 * await import('@pixi/layout');
 * await ensureYoga();
 */
export async function ensureYoga() {
  const { getYoga, getYogaConfig, setYoga, setYogaConfig } = await import('@pixi/layout');
  if (!getYoga()) {
    const { loadYoga } = await import('yoga-layout/load');
    setYoga(await loadYoga());
  }
  if (!getYogaConfig()) {
    setYogaConfig(getYoga().Config.create());
  }
}
