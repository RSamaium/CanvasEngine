import {
  Container,
  Graphics,
  h,
  mount,
  useProps,
  animatedSignal,
  RadialGradient,
  isSignal,
  signal,
  isObservable,
  tick,
  Mesh,
} from "canvasengine";
import { Geometry, Shader, UniformGroup, GlProgram } from "pixi.js";

const MAX_SPOTS = 16;

function createNightShader(): GlProgram {
  const vertexSrc = /* glsl */ `
    precision mediump float;
    attribute vec2 aPosition;
    attribute vec2 aUV;
    varying vec2 vUV;
    uniform mat3 uProjectionMatrix;
    uniform mat3 uWorldTransformMatrix;
    uniform mat3 uTransformMatrix;
    void main() {
      vUV = aUV;
      mat3 modelViewProjectionMatrix = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
      vec3 world = modelViewProjectionMatrix * vec3(aPosition, 1.0);
      gl_Position = vec4(world.xy, 0.0, 1.0);
    }
  `;

  const fragmentSrc = /* glsl */ `
    precision mediump float;
    varying vec2 vUV;

    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uOrigin;
    uniform float uDarkness;
    uniform vec3 uTint;
    uniform int uSpotCount;
    uniform vec4 uSpots[${MAX_SPOTS}];

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float spotGlow(vec2 fragPos, vec4 spot) {
      vec2 pos = spot.xy;
      float radius = max(spot.z, 1.0);
      float intensity = spot.w;
      float dist = length(fragPos - pos);
      float t = dist / radius;
      float core = smoothstep(1.0, 0.0, t);
      float halo = exp(-t * t * 2.5);
      float seed = hash(pos);
      float flicker = 0.85 + 0.15 * sin(uTime * 1.7 + seed * 6.2831);
      return intensity * mix(core, halo, 0.6) * flicker;
    }

    void main() {
      vec2 fragPos = uOrigin + vUV * uResolution;
      float light = 0.0;
      for (int i = 0; i < ${MAX_SPOTS}; i++) {
        if (i >= uSpotCount) {
          break;
        }
        light += spotGlow(fragPos, uSpots[i]);
      }

      light = clamp(light, 0.0, 1.0);
      float alpha = clamp(uDarkness - light * 0.95, 0.0, 1.0);
      vec3 color = mix(vec3(0.0), uTint, light);
      gl_FragColor = vec4(color, alpha);
    }
  `;

  return new GlProgram({
    vertex: vertexSrc,
    fragment: fragmentSrc,
  });
}

export function LightSpot(opts) {
  const { radius } = useProps(opts);
  const scale = animatedSignal(1);

  const minScale = 1;
  const maxScale = 2; // Reduced max scale for subtler effect
  const scintillationSpeed = 0.001; // Significantly reduced for slower scintillation

  const animate = () => {
    // Use time-based animation for smoother, slower scintillation
    const time = Date.now() * scintillationSpeed;

    // Combine multiple sine waves for a more natural, less predictable effect
    const scintillationFactor =
      (Math.sin(time) + Math.sin(time * 1.3) + Math.sin(time * 0.7)) / 3;

    // Map the scintillation factor to the scale range
    const newScale =
      minScale + (maxScale - minScale) * (scintillationFactor * 0.5 + 0.5);

    scale.update(() => newScale);

    requestAnimationFrame(animate);
  };

  animate();

  const draw = (g) => {
    const size = radius() * 2;
    const gradient = new RadialGradient(size, size, 0, size, size, 0);
    gradient.addColorStop(0, "rgba(255, 255, 0, 1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 0, 0.3)");
    gradient.addColorStop(0.8, "rgba(255, 255, 0, 0)");

    const translate = size / 2;

    g.rect(-translate, -translate, size, size).fill(
      gradient.render({ translate: { x: translate, y: translate } })
    );
  };

  return h(Graphics, {
    draw,
    ...opts,
    scale,
  });
}

export function NightAmbiant(props) {
  const {
    children,
    darkness = 0.85,
    tint = [1.0, 0.95, 0.8],
    context,
  } = useProps(props);
  const width = signal(0);
  const height = signal(0);
  const originX = signal(0);
  const originY = signal(0);
  let subscription;
  let spotElements: any[] = [];

  const normalizeChildren = (elements) => {
    if (!elements) return [];
    return Array.isArray(elements) ? elements : [elements];
  };

  const updateSpotElements = (elements) => {
    const list = normalizeChildren(elements);
    spotElements = list.filter((child) => child && child.props);
  };

  for (const child of normalizeChildren(children)) {
    if (isObservable(child)) {
      if (subscription) {
        subscription.unsubscribe();
      }
      subscription = child.subscribe((event: any) => {
        updateSpotElements(event.fullElements);
      });
      break;
    }
  }

  if (!subscription) {
    updateSpotElements(children);
  }

  mount((el) => {
    // Listen to layout events to get computed dimensions when no viewport is present.
    (el.componentInstance as any).on("layout", () => {
      if (context?.viewport) return;
      width.update(() => (el.componentInstance as any).getWidth());
      height.update(() => (el.componentInstance as any).getHeight());
      originX.update(() => 0);
      originY.update(() => 0);
    });
  });

  const glProgram = createNightShader();
  const geometry = new Geometry({
    attributes: {
      aPosition: [0, 0, 1, 0, 1, 1, 0, 1],
      aUV: [0, 0, 1, 0, 1, 1, 0, 1],
    },
    indexBuffer: [0, 1, 2, 0, 2, 3],
  });

  const darknessSignal =
    typeof darkness === "function" ? darkness : signal(darkness);
  const tintSignal = typeof tint === "function" ? tint : signal(tint);
  const spotData = new Float32Array(MAX_SPOTS * 4);
  const uniformGroup = new UniformGroup({
    uTime: { value: 0, type: "f32" },
    uResolution: { value: [width(), height()], type: "vec2<f32>" },
    uOrigin: { value: [originX(), originY()], type: "vec2<f32>" },
    uDarkness: { value: darknessSignal(), type: "f32" },
    uTint: { value: tintSignal(), type: "vec3<f32>" },
    uSpotCount: { value: 0, type: "i32" },
    uSpots: { value: spotData, type: "vec4<f32>", size: MAX_SPOTS },
  });

  const shader = new Shader({
    glProgram,
    resources: { uniforms: uniformGroup },
  });

  const readSpotValue = (child, key, fallback) => {
    const observable = child?.propObservables?.[key];
    if (isSignal(observable)) {
      return observable();
    }
    const value = child?.props?.[key];
    return value !== undefined ? value : fallback;
  };

  const normalizeTint = (value) => {
    if (Array.isArray(value) && value.length >= 3) {
      return value;
    }
    if (typeof value === "number") {
      const r = ((value >> 16) & 255) / 255;
      const g = ((value >> 8) & 255) / 255;
      const b = (value & 255) / 255;
      return [r, g, b];
    }
    return [1.0, 0.95, 0.8];
  };

  let timeAccumulator = Math.random() * 10.0;
  let prevWidth = width();
  let prevHeight = height();
  let prevOriginX = originX();
  let prevOriginY = originY();

  tick(({ deltaTime }) => {
    timeAccumulator += deltaTime / 600;
    uniformGroup.uniforms.uTime = timeAccumulator;

    if (context?.viewport?.getVisibleBounds) {
      const bounds = context.viewport.getVisibleBounds();
      if (bounds) {
        if (bounds.width !== width()) width.update(() => bounds.width);
        if (bounds.height !== height()) height.update(() => bounds.height);
        if (bounds.x !== originX()) originX.update(() => bounds.x);
        if (bounds.y !== originY()) originY.update(() => bounds.y);
      }
    }

    const currentWidth = width();
    const currentHeight = height();
    if (currentWidth !== prevWidth || currentHeight !== prevHeight) {
      uniformGroup.uniforms.uResolution = [currentWidth, currentHeight];
      prevWidth = currentWidth;
      prevHeight = currentHeight;
    }

    const currentOriginX = originX();
    const currentOriginY = originY();
    if (currentOriginX !== prevOriginX || currentOriginY !== prevOriginY) {
      uniformGroup.uniforms.uOrigin = [currentOriginX, currentOriginY];
      prevOriginX = currentOriginX;
      prevOriginY = currentOriginY;
    }

    uniformGroup.uniforms.uDarkness = darknessSignal();
    uniformGroup.uniforms.uTint = normalizeTint(tintSignal());

    const spotCount = Math.min(spotElements.length, MAX_SPOTS);
    spotData.fill(0);
    for (let i = 0; i < spotCount; i++) {
      const child = spotElements[i];
      const x = readSpotValue(child, "x", 0);
      const y = readSpotValue(child, "y", 0);
      const radius = readSpotValue(child, "radius", 120);
      const intensity = readSpotValue(child, "intensity", 1.0);
      const base = i * 4;
      spotData[base] = x;
      spotData[base + 1] = y;
      spotData[base + 2] = radius;
      spotData[base + 3] = intensity;
    }
    uniformGroup.uniforms.uSpotCount = spotCount;
    uniformGroup.uniforms.uSpots = spotData;
  });

  return h(
    Container,
    {
      width: "100%",
      height: "100%",
      ...props,
    },
    h(Mesh, {
      geometry,
      shader,
      width,
      height,
      x: originX,
      y: originY,
    })
  );
}
