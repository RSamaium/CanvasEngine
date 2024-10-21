import * as PIXI from "pixi.js";
import { FX } from "revolt-fx";
import { h, mount, tick } from "../engine/signal";
import { Container } from "../components";
import { on } from "../engine/trigger";
import { useProps } from "../hooks/useProps";

export function Particle(options) {
  const { emit, settings = {} } = options;
  const { name } = useProps(options);
  const fx = new FX();
  let element;

  PIXI.Assets.add({ alias: "fx_settings", src: "/default-bundle.json" });
  PIXI.Assets.add({
    alias: "fx_spritesheet",
    src: "/revoltfx-spritesheet.json",
  });

  tick(({deltaRatio}) => {
    fx.update(deltaRatio);
  });

  mount(async (_element) => {
    element = _element;

    const data = await PIXI.Assets.load(["fx_settings", "fx_spritesheet"]);
    let fxSettings = {...data.fx_settings};

    if (settings.emitters) {
      const lastId = 10000;
      const emittersWithIds = settings.emitters.map((emitter, index) => ({
        ...emitter,
        id: lastId + index
      }));

      fxSettings.emitters = [
        ...fxSettings.emitters,
        ...emittersWithIds,
      ];

    }

    fx.initBundle(fxSettings, true);
  });

  on(emit, () => {
    const emitter = fx.getParticleEmitter(name());
    emitter.init(element.componentInstance);
  });

  return h(Container);
}
