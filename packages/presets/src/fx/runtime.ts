import { Container, Matrix, Sprite, Texture } from "pixi.js";
import type {
  FxEmitterConfig,
  FxInstance,
  FxParticle,
  FxPreset,
  FxRuntimeOptions,
} from "./types";
import { getParticleTextures, getShapeTexture, preloadPresetTextures } from "./textures";
import {
  colorStops,
  createRandom,
  curveStops,
  easeValue,
  normalizeAngle,
  rangeValue,
  sampleColorStops,
  sampleStops,
} from "./utils";

type RuntimeEmitter = FxEmitterConfig & {
  elapsed: number;
  emittedBurst: boolean;
  burstsDone: number;
  carry: number;
  particles: FxParticle[];
};

type RuntimeInstance = FxInstance & {
  emitters: RuntimeEmitter[];
  options: FxRuntimeOptions;
  lastX: number;
  lastY: number;
};

const perspectiveMatrix = new Matrix();

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
      lastX: container.x,
      lastY: container.y,
      emitters: preset.emitters.map((emitter) => ({
        ...emitter,
        elapsed: 0,
        emittedBurst: false,
        burstsDone: 0,
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

    this.compensateWorldSpace(instance);

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

  /**
   * Keeps `space: 'world'` particles where they were emitted when the Fx container moves,
   * which turns a moving emitter into a trail.
   */
  private compensateWorldSpace(instance: RuntimeInstance) {
    const { container } = instance;
    const dx = container.x - instance.lastX;
    const dy = container.y - instance.lastY;
    instance.lastX = container.x;
    instance.lastY = container.y;
    if (!dx && !dy) return;

    const cos = Math.cos(-container.rotation);
    const sin = Math.sin(-container.rotation);
    const localX = (dx * cos - dy * sin) / (container.scale.x || 1);
    const localY = (dx * sin + dy * cos) / (container.scale.y || 1);

    for (const emitter of instance.emitters) {
      if (emitter.space !== "world") continue;
      for (const particle of emitter.particles) {
        particle.sprite.x -= localX;
        particle.sprite.y -= localY;
        if (particle.centerX !== undefined) particle.centerX -= localX;
        if (particle.centerY !== undefined) particle.centerY -= localY;
      }
    }
  }

  private updateEmitter(instance: RuntimeInstance, emitter: RuntimeEmitter, deltaMs: number) {
    emitter.elapsed += deltaMs;
    const delay = emitter.delay ?? 0;
    if (emitter.elapsed >= delay && this.isEmitterActive(instance, emitter)) {
      if (emitter.burst) this.emitBursts(instance, emitter, emitter.elapsed - delay);

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

  private emitBursts(instance: RuntimeInstance, emitter: RuntimeEmitter, activeTime: number) {
    const interval = emitter.burstInterval ?? 0;
    const count = Math.max(1, emitter.burstCount ?? 1);
    const repeatForever = interval > 0 && (instance.loop || Boolean(emitter.loop));

    while (
      (repeatForever || emitter.burstsDone < count) &&
      activeTime >= emitter.burstsDone * interval
    ) {
      for (let i = 0; i < emitter.burst!; i++) this.spawnParticle(instance, emitter);
      emitter.burstsDone++;
    }
    emitter.emittedBurst = !repeatForever && emitter.burstsDone >= count;
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
    const globalMax = instance.options.maxParticles ?? this.maxParticles;
    if (this.activeCount >= globalMax) return;
    if (emitter.maxParticles !== undefined && emitter.particles.length >= emitter.maxParticles) return;

    const particleConfig = emitter.particle ?? {};
    const textures = getParticleTextures(particleConfig, this.random);
    if (!textures.length) {
      if (instance.options.missingTexture === "skip") return;
      if (instance.options.missingTexture === "error") {
        throw new Error("Fx particle texture is not loaded");
      }
      textures.push(getShapeTexture(particleConfig.shape));
    }

    const centerX = (emitter.x ?? 0) + (instance.options.x ?? 0);
    const centerY = (emitter.y ?? 0) + (instance.options.y ?? 0);
    const ellipse = emitter.ellipse ?? 1;
    let offsetX = rangeValue([-(emitter.spreadX ?? 0), emitter.spreadX ?? 0], this.random, 0);
    let offsetY = rangeValue([-(emitter.spreadY ?? 0), emitter.spreadY ?? 0], this.random, 0);

    if (emitter.radius !== undefined) {
      const inner = emitter.innerRadius ?? 0;
      const outer = rangeValue(emitter.radius, this.random, 0);
      // sqrt keeps a uniform density on filled circles
      const distance = inner + (outer - inner) * Math.sqrt(this.random());
      const theta = this.random() * Math.PI * 2;
      offsetX += Math.cos(theta) * distance;
      offsetY += Math.sin(theta) * distance * ellipse;
    }

    const sprite = this.pool.pop() ?? new Sprite(Texture.WHITE);
    sprite.texture = textures[0];
    sprite.visible = true;
    sprite.anchor.set(particleConfig.anchor?.x ?? 0.5, particleConfig.anchor?.y ?? 0.5);
    sprite.x = centerX + offsetX;
    sprite.y = centerY + offsetY;
    const rotationOffset = (rangeValue(particleConfig.rotation, this.random, 0) * Math.PI) / 180;
    sprite.rotation = rotationOffset;
    sprite.blendMode = (particleConfig.blendMode ?? "normal") as any;

    const speed = rangeValue(emitter.speed, this.random, 0);
    const angle = this.velocityAngle(emitter, offsetX, offsetY / (ellipse || 1));
    const alphaStops = curveStops(particleConfig.alpha, this.random, [1, 0]);
    const scaleStops = curveStops(particleConfig.scale, this.random, [1, 0]);
    const scaleXStops = curveStops(particleConfig.scaleX, this.random, [1]);
    const scaleYStops = curveStops(particleConfig.scaleY, this.random, [1]);
    const tintStops = colorStops(particleConfig.tint ?? particleConfig.color);
    const orbit = (rangeValue(emitter.orbit, this.random, 0) * Math.PI) / 180;
    const align = particleConfig.align === "velocity";

    sprite.alpha = alphaStops[0];
    sprite.tint = tintStops[0];
    sprite.scale.set(scaleStops[0] * scaleXStops[0], scaleStops[0] * scaleYStops[0]);
    if (align && speed) sprite.rotation = angle + rotationOffset;
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
      startAlpha: alphaStops[0],
      endAlpha: alphaStops[alphaStops.length - 1],
      startScale: scaleStops[0],
      endScale: scaleStops[scaleStops.length - 1],
      startTint: tintStops[0],
      endTint: tintStops[tintStops.length - 1],
      rotationSpeed: (rangeValue(particleConfig.rotationSpeed, this.random, 0) * Math.PI) / 180,
      frameRate: particleConfig.frameRate ?? 12,
      frames: textures,
      ease: particleConfig.ease ?? "linear",
      alphaStops,
      scaleStops,
      scaleXStops,
      scaleYStops,
      tintStops,
      drag: emitter.drag ?? 0,
      orbit,
      centerX,
      centerY,
      ellipse,
      align,
      rotationOffset,
      perspective: particleConfig.perspective,
      angle: sprite.rotation,
    };
    emitter.particles.push(particle);
    this.activeCount++;
    instance.options.onParticleSpawn?.(particle);
  }

  private velocityAngle(emitter: FxEmitterConfig, offsetX: number, offsetY: number) {
    const direction = emitter.direction ?? "angle";
    if (direction === "angle" || (offsetX === 0 && offsetY === 0)) {
      return normalizeAngle(emitter.angle ?? (direction === "angle" ? 0 : [0, 360]), this.random);
    }
    const outward = Math.atan2(offsetY, offsetX);
    if (direction === "inward") return outward + Math.PI;
    if (direction === "tangent") return outward + Math.PI / 2;
    return outward;
  }

  private updateParticle(particle: FxParticle, deltaMs: number) {
    const seconds = deltaMs / 1000;
    const progress = particle.age / particle.lifetime;
    const eased = easeValue(particle.ease, progress);
    const sprite = particle.sprite;
    const previousX = sprite.x;
    const previousY = sprite.y;

    particle.vx += particle.ax * seconds;
    particle.vy += (particle.ay + particle.gravity) * seconds;
    if (particle.drag) {
      const damping = Math.exp(-particle.drag * seconds);
      particle.vx *= damping;
      particle.vy *= damping;
    }
    sprite.x += particle.vx * seconds;
    sprite.y += particle.vy * seconds;

    if (particle.orbit) {
      const ellipse = particle.ellipse || 1;
      const dx = sprite.x - particle.centerX!;
      const dy = (sprite.y - particle.centerY!) / ellipse;
      const cos = Math.cos(particle.orbit * seconds);
      const sin = Math.sin(particle.orbit * seconds);
      sprite.x = particle.centerX! + dx * cos - dy * sin;
      sprite.y = particle.centerY! + (dx * sin + dy * cos) * ellipse;
      const vx = particle.vx;
      particle.vx = vx * cos - particle.vy * sin;
      particle.vy = vx * sin + particle.vy * cos;
    }

    if (particle.align) {
      const moveX = sprite.x - previousX;
      const moveY = sprite.y - previousY;
      if (moveX || moveY) sprite.rotation = Math.atan2(moveY, moveX) + (particle.rotationOffset ?? 0);
    } else if (particle.perspective) {
      particle.angle = (particle.angle ?? 0) + particle.rotationSpeed * seconds;
    } else {
      sprite.rotation += particle.rotationSpeed * seconds;
    }

    sprite.alpha = sampleStops(particle.alphaStops ?? [particle.startAlpha, particle.endAlpha], eased);
    const scale = sampleStops(particle.scaleStops ?? [particle.startScale, particle.endScale], eased);
    sprite.scale.set(
      scale * (particle.scaleXStops ? sampleStops(particle.scaleXStops, eased) : 1),
      scale * (particle.scaleYStops ? sampleStops(particle.scaleYStops, eased) : 1)
    );
    sprite.tint = sampleColorStops(particle.tintStops ?? [particle.startTint, particle.endTint], eased);
    if (particle.perspective) this.applyPerspective(particle);

    if (particle.frames.length > 1) {
      const frame = Math.min(
        particle.frames.length - 1,
        Math.floor((particle.age / 1000) * particle.frameRate) % particle.frames.length
      );
      sprite.texture = particle.frames[frame];
    }
  }

  /** Rotates in the ground plane, then squashes vertically (scale → rotation → squash). */
  private applyPerspective(particle: FxParticle) {
    const sprite = particle.sprite;
    const angle = particle.angle ?? 0;
    const scaleX = sprite.scale.x;
    const scaleY = sprite.scale.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const squash = particle.perspective!;
    perspectiveMatrix.set(
      cos * scaleX,
      sin * scaleX * squash,
      -sin * scaleY,
      cos * scaleY * squash,
      sprite.x,
      sprite.y
    );
    sprite.setFromMatrix(perspectiveMatrix);
  }

  private recycleParticle(container: Container, particle: FxParticle) {
    container.removeChild(particle.sprite);
    particle.sprite.visible = false;
    particle.sprite.alpha = 1;
    particle.sprite.tint = 0xffffff;
    particle.sprite.scale.set(1);
    particle.sprite.rotation = 0;
    particle.sprite.skew.set(0, 0);
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
