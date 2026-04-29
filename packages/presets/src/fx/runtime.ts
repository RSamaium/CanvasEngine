import { Container, Sprite, Texture } from "pixi.js";
import type {
  FxEmitterConfig,
  FxInstance,
  FxParticle,
  FxParticleConfig,
  FxPreset,
  FxRuntimeOptions,
} from "./types";
import { getParticleTextures, getShapeTexture, preloadPresetTextures } from "./textures";
import {
  colorToNumber,
  createRandom,
  easeValue,
  lerp,
  lerpColor,
  normalizeAngle,
  rangeValue,
} from "./utils";

type RuntimeEmitter = FxEmitterConfig & {
  elapsed: number;
  emittedBurst: boolean;
  carry: number;
  particles: FxParticle[];
};

type RuntimeInstance = FxInstance & {
  emitters: RuntimeEmitter[];
  options: FxRuntimeOptions;
};

export class FxRuntime {
  private instances = new Set<RuntimeInstance>();
  private pool: Sprite[] = [];
  private random: () => number;
  private maxParticles: number;
  private activeCount = 0;

  constructor(options: { seed?: number; maxParticles?: number } = {}) {
    this.random = createRandom(options.seed);
    this.maxParticles = options.maxParticles ?? 600;
  }

  async preload(preset: FxPreset) {
    await preloadPresetTextures(preset);
  }

  spawn(container: Container, preset: FxPreset, options: FxRuntimeOptions & { loop?: boolean } = {}): FxInstance {
    const instance: RuntimeInstance = {
      container,
      preset,
      elapsed: 0,
      loop: Boolean(options.loop),
      complete: false,
      activeParticles: 0,
      emitters: preset.emitters.map((emitter) => ({
        ...emitter,
        elapsed: 0,
        emittedBurst: false,
        carry: 0,
        particles: [],
      })),
      options,
      stop: () => {
        instance.loop = false;
        instance.complete = true;
        instance.emitters.forEach((emitter) => {
          emitter.duration = 0;
          emitter.loop = false;
        });
      },
    };

    this.instances.add(instance);
    options.onStart?.(instance);
    return instance;
  }

  update(deltaMs: number) {
    const delta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
    for (const instance of Array.from(this.instances)) {
      this.updateInstance(instance, delta);
    }
  }

  clear() {
    for (const instance of Array.from(this.instances)) {
      this.recycleInstance(instance);
    }
    this.instances.clear();
  }

  get activeInstances() {
    return this.instances.size;
  }

  private updateInstance(instance: RuntimeInstance, deltaMs: number) {
    instance.elapsed += deltaMs;
    const delay = instance.preset.delay ?? 0;
    if (instance.elapsed < delay) return;

    let hasLiveParticles = false;
    let hasEmitting = false;

    for (const emitter of instance.emitters) {
      this.updateEmitter(instance, emitter, deltaMs);
      hasLiveParticles ||= emitter.particles.length > 0;
      hasEmitting ||= this.isEmitterActive(instance, emitter);
    }

    instance.activeParticles = instance.emitters.reduce(
      (count, emitter) => count + emitter.particles.length,
      0
    );

    if (!hasEmitting && !hasLiveParticles) {
      instance.complete = true;
    }

    if (instance.complete && !hasLiveParticles) {
      this.instances.delete(instance);
      instance.options.onComplete?.(instance);
    }
  }

  private updateEmitter(instance: RuntimeInstance, emitter: RuntimeEmitter, deltaMs: number) {
    emitter.elapsed += deltaMs;
    const delay = emitter.delay ?? 0;
    if (emitter.elapsed >= delay && this.isEmitterActive(instance, emitter)) {
      if (emitter.burst && !emitter.emittedBurst) {
        for (let i = 0; i < emitter.burst; i++) this.spawnParticle(instance, emitter);
        emitter.emittedBurst = true;
      }

      if (emitter.rate) {
        emitter.carry += (emitter.rate * deltaMs) / 1000;
        const count = Math.floor(emitter.carry);
        emitter.carry -= count;
        for (let i = 0; i < count; i++) this.spawnParticle(instance, emitter);
      }
    }

    for (let i = emitter.particles.length - 1; i >= 0; i--) {
      const particle = emitter.particles[i];
      particle.age += deltaMs;
      if (particle.age >= particle.lifetime) {
        this.recycleParticle(instance.container, particle);
        emitter.particles.splice(i, 1);
      } else {
        this.updateParticle(particle, deltaMs);
      }
    }
  }

  private isEmitterActive(instance: RuntimeInstance, emitter: RuntimeEmitter) {
    if (instance.complete) return false;
    const delay = emitter.delay ?? 0;
    const elapsed = emitter.elapsed - delay;
    if (elapsed < 0) return false;
    if (emitter.burst && !emitter.emittedBurst) return true;
    if (instance.loop || emitter.loop) return true;
    const duration = emitter.duration ?? instance.preset.duration ?? 0;
    return elapsed <= duration;
  }

  private spawnParticle(instance: RuntimeInstance, emitter: RuntimeEmitter) {
    const maxParticles = emitter.maxParticles ?? instance.options.maxParticles ?? this.maxParticles;
    if (this.activeCount >= maxParticles || emitter.particles.length >= maxParticles) return;

    const particleConfig = emitter.particle ?? {};
    const textures = getParticleTextures(particleConfig, this.random);
    if (!textures.length) {
      if (instance.options.missingTexture === "skip") return;
      if (instance.options.missingTexture === "error") {
        throw new Error("Fx particle texture is not loaded");
      }
      textures.push(getShapeTexture(particleConfig.shape));
    }

    const sprite = this.pool.pop() ?? new Sprite(Texture.WHITE);
    sprite.texture = textures[0];
    sprite.visible = true;
    sprite.anchor.set(particleConfig.anchor?.x ?? 0.5, particleConfig.anchor?.y ?? 0.5);
    sprite.x = (emitter.x ?? 0) + rangeValue([-(emitter.spreadX ?? 0), emitter.spreadX ?? 0], this.random, 0);
    sprite.y = (emitter.y ?? 0) + rangeValue([-(emitter.spreadY ?? 0), emitter.spreadY ?? 0], this.random, 0);
    sprite.rotation = (rangeValue(particleConfig.rotation, this.random, 0) * Math.PI) / 180;
    sprite.blendMode = (particleConfig.blendMode ?? "normal") as any;

    const angle = normalizeAngle(emitter.angle, this.random);
    const speed = rangeValue(emitter.speed, this.random, 0);
    const alpha = particleConfig.alpha ?? [1, 0];
    const scale = particleConfig.scale ?? [1, 0];
    const tint = particleConfig.tint ?? particleConfig.color ?? 0xffffff;
    const startTint = colorToNumber(Array.isArray(tint) ? tint[0] : tint);
    const endTint = colorToNumber(Array.isArray(tint) ? tint[1] : tint, startTint);
    const startScale = rangeValue(Array.isArray(scale) ? scale[0] : scale, this.random, 1);
    const endScale = Array.isArray(scale) ? rangeValue(scale[1], this.random, 0) : startScale;
    const startAlpha = rangeValue(Array.isArray(alpha) ? alpha[0] : alpha, this.random, 1);
    const endAlpha = Array.isArray(alpha) ? rangeValue(alpha[1], this.random, 0) : startAlpha;

    sprite.alpha = startAlpha;
    sprite.tint = startTint;
    sprite.scale.set(startScale);
    instance.container.addChild(sprite);

    const particle: FxParticle = {
      sprite,
      age: 0,
      lifetime: rangeValue(particleConfig.lifetime, this.random, 600),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ax: emitter.accelerationX ?? 0,
      ay: emitter.accelerationY ?? 0,
      gravity: emitter.gravity ?? 0,
      startAlpha,
      endAlpha,
      startScale,
      endScale,
      startTint,
      endTint,
      rotationSpeed: (rangeValue(particleConfig.rotationSpeed, this.random, 0) * Math.PI) / 180,
      frameRate: particleConfig.frameRate ?? 12,
      frames: textures,
      ease: particleConfig.ease ?? "linear",
    };
    emitter.particles.push(particle);
    this.activeCount++;
    instance.options.onParticleSpawn?.(particle);
  }

  private updateParticle(particle: FxParticle, deltaMs: number) {
    const seconds = deltaMs / 1000;
    const progress = particle.age / particle.lifetime;
    const eased = easeValue(particle.ease, progress);
    particle.vx += particle.ax * seconds;
    particle.vy += (particle.ay + particle.gravity) * seconds;
    particle.sprite.x += particle.vx * seconds;
    particle.sprite.y += particle.vy * seconds;
    particle.sprite.rotation += particle.rotationSpeed * seconds;
    particle.sprite.alpha = lerp(particle.startAlpha, particle.endAlpha, eased);
    particle.sprite.scale.set(lerp(particle.startScale, particle.endScale, eased));
    particle.sprite.tint = lerpColor(particle.startTint, particle.endTint, eased);

    if (particle.frames.length > 1) {
      const frame = Math.min(
        particle.frames.length - 1,
        Math.floor((particle.age / 1000) * particle.frameRate) % particle.frames.length
      );
      particle.sprite.texture = particle.frames[frame];
    }
  }

  private recycleParticle(container: Container, particle: FxParticle) {
    container.removeChild(particle.sprite);
    particle.sprite.visible = false;
    particle.sprite.alpha = 1;
    particle.sprite.tint = 0xffffff;
    particle.sprite.scale.set(1);
    this.pool.push(particle.sprite);
    this.activeCount = Math.max(0, this.activeCount - 1);
  }

  private recycleInstance(instance: RuntimeInstance) {
    for (const emitter of instance.emitters) {
      for (const particle of emitter.particles) {
        this.recycleParticle(instance.container, particle);
      }
      emitter.particles = [];
    }
  }

}
