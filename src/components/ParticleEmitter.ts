import * as particles from "@barvynkoa/particle-emitter";
import { createComponent, registerComponent } from "../engine/reactive";
import { CanvasContainer } from "./Container";
import { Signal } from "@signe/reactive";

class CanvasParticlesEmitter extends CanvasContainer {
  private emitter: particles.Emitter | null;
  private elapsed: number = Date.now();

  onMount(params) {
    super.onMount(params);
    const { props } = params;
    const tick: Signal = props.context.tick;
    this.emitter = new particles.Emitter(this, props.config);
    //this.emitter.emit = true

    this.subscriptionTick = tick.observable.subscribe((value) => {
      if (!this.emitter) return;
      const now = Date.now();
      this.emitter.update((now - this.elapsed) * 0.001);
      this.elapsed = now;
    });
  }

  onUpdate(props) {}

  onDestroy(): void {
    super.onDestroy();
    this.emitter?.destroy();
    this.emitter = null;
    this.subscriptionTick.unsubscribe();
  }
}

registerComponent("ParticlesEmitter", CanvasParticlesEmitter);

export function ParticlesEmitter(props) {
  return createComponent("ParticlesEmitter", props);
}
