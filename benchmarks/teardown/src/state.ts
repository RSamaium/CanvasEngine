import { signal } from "canvasengine";

const params = new URLSearchParams(window.location.search);
const count = Number(params.get("count") ?? 100);
const columns = 20;

/** Characters laid out by flex (`layout=1`) instead of absolute positions. */
export const layoutMode = params.get("layout") === "1";

/** Toggles the whole scene, like a map transfer in a game. */
export const showScene = signal(false);

/** The scene resets `items` and `hudRows` when it unmounts (`reset=1`). */
export const resetOnUnmount = params.get("reset") === "1";

/** Characters: a body, a name and an HP bar, with reactive position and HP. */
const initialItems = () =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    name: `NPC ${index}`,
    x: signal((index % columns) * 60 + 20),
    y: signal(Math.floor(index / columns) * 60 + 30),
    hp: signal(10 + (index % 20)),
  }));
export const items = signal(initialItems());

/** A flex laid out HUD panel. */
const initialHudRows = () =>
  Array.from({ length: 20 }, (_, index) => ({ id: index, label: `Quest ${index}` }));
export const hudRows = signal(initialHudRows());

/** Restores the scene state before it is shown again. */
export function resetState() {
  if (items().length !== count) items.set(initialItems());
  if (hudRows().length !== 20) hudRows.set(initialHudRows());
}
