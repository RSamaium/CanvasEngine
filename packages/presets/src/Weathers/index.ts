import {
  tick,
  useProps,
  h,
  Mesh,
  signal,
} from "canvasengine";
import { Geometry, Shader, GlProgram, UniformGroup } from "pixi.js";

/**
 * Weather Effect Component
 * 
 * Creates a realistic rain effect using WebGL shaders with customizable parameters.
 * The effect simulates raindrops falling with wind influence, density control, and speed adjustment.
 * 
 * ## Design
 * 
 * The component uses a fragment shader to generate procedural rain drops with:
 * - **Procedural generation**: Each raindrop is generated using hash functions for randomness
 * - **Wind simulation**: Raindrops are affected by wind direction and strength as they fall
 * - **Density control**: Number of visible raindrops can be adjusted
 * - **Speed variation**: Each drop has slightly different falling speed for realism
 * - **Visual styling**: Zelda-inspired rain appearance with proper fade effects
 * 
 * @param {Object} options - Configuration options for the weather effect
 * @param {number} [options.speed=0.5] - Rain falling speed (0.1 = slow, 2.0 = fast)
 * @param {number} [options.windDirection=0.0] - Wind direction (-1.0 = left, 1.0 = right)
 * @param {number} [options.windStrength=0.2] - Wind strength (0.0 = no wind, 1.0 = strong)
 * @param {number} [options.density=180.0] - Rain density (number of raindrops, 50-400)
 * @param {Array<number>} [options.resolution=[1000, 1000]] - Screen resolution for proper scaling
 * 
 * @example
 * ```jsx
 * // Basic usage with default settings
 * <Weather />
 * 
 * // Customized heavy rain with strong wind
 * <Weather 
 *   speed={1.5}
 *   windDirection={0.8}
 *   windStrength={0.6}
 *   density={300}
 * />
 * 
 * // Light drizzle
 * <Weather 
 *   speed={0.2}
 *   density={80}
 *   windStrength={0.1}
 * />
 * 
 * // Using signals for dynamic control
 * const rainSpeed = signal(0.5);
 * const windDir = signal(0.0);
 * 
 * <Weather 
 *   speed={rainSpeed}
 *   windDirection={windDir}
 * />
 * ```
 * 
 * @returns {JSX.Element} A mesh component with the weather shader effect
 */
export const WeatherEffect = (options) => {
  const { 
    speed = signal(0.5),
    windDirection = signal(0.0),
    windStrength = signal(0.2),
    density = signal(180.0),
    resolution = signal([1000, 1000])
  } = useProps(options);

  // Convert to signals if not already
  const speedSignal = typeof speed === 'function' ? speed : signal(speed);
  const windDirectionSignal = typeof windDirection === 'function' ? windDirection : signal(windDirection);
  const windStrengthSignal = typeof windStrength === 'function' ? windStrength : signal(windStrength);
  const densitySignal = typeof density === 'function' ? density : signal(density);
  const resolutionSignal = typeof resolution === 'function' ? resolution : signal(resolution);

  // Vertex shader - handles vertex positioning and UV mapping
  const vertexSrc = /* glsl */ `
          precision mediump float;
          attribute vec2 aPosition;
          attribute vec2 aUV;
          varying   vec2 vUV;
          void main() {
              vUV = aUV;
              gl_Position = vec4(aPosition, 0.0, 1.0);
          }
      `;

  // Fragment shader - generates the rain effect
  const fragmentSrc = /* glsl */ `
          precision mediump float;
          varying vec2 vUV;
          uniform float uTime;
          uniform vec2  uResolution;
          uniform float uRainSpeed;
          uniform float uWindDirection;
          uniform float uWindStrength;
          uniform float uRainDensity;
    
          // Hash function for pseudo-random number generation
          float hash(float n){ return fract(sin(n)*43758.5453); }
    
          // Generate a single raindrop at given UV coordinates
          float rainDrop(vec2 uv, float t, float seed) {
              // Random X position with wider coverage for screen edges
              float x = hash(seed) * 2.4 - 1.2;
              
              // Falling speed with variation per drop
              float baseSpeed = 1.0 + hash(seed + 1.0) * 1.5;
              float speed = baseSpeed * uRainSpeed;
              
              // Y position falling from top (1.0) to bottom (-1.0)
              float y = 1.2 - fract(t * speed + hash(seed + 2.0)) * 2.4;
              
              // Wind effect: more drift as drop falls further
              float fallProgress = (1.2 - y) / 2.4; // 0 = top, 1 = bottom
              float windOffset = uWindDirection * uWindStrength * fallProgress * 0.5;
              x += windOffset;
              
              vec2 dropPos = vec2(x, y);
              vec2 diff = uv - dropPos;
              
              // Raindrop shape (thin streaks)
              float dropWidth = 0.0015 + hash(seed + 3.0) * 0.0005;
              float dropLength = 0.025 + hash(seed + 4.0) * 0.015;
              
              // Slight tilt based on wind
              float windAngle = uWindDirection * uWindStrength * 0.2;
              float cosA = cos(windAngle);
              float sinA = sin(windAngle);
              vec2 rotatedDiff = vec2(
                  diff.x * cosA - diff.y * sinA,
                  diff.x * sinA + diff.y * cosA
              );
              
              // Distance calculation for thin streaks
              float distX = abs(rotatedDiff.x) / dropWidth;
              float distY = abs(rotatedDiff.y) / dropLength;
              float dist = max(distX, distY * 0.4);
              
              // Intensity with fade and variation (Zelda-style)
              float intensity = 1.0 - smoothstep(0.0, 1.2, dist);
              intensity *= 0.7 + 0.3 * hash(seed + 5.0);
              
              // Natural fade at top and bottom edges
              intensity *= smoothstep(-1.2, -0.8, y) * smoothstep(1.2, 0.8, y);
              
              return intensity;
          }
    
          void main(){
              // Normalized UV coordinates centered on screen
              vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
              
              float rain = 0.0;
              
              // Generate multiple raindrops
              for(float i = 0.0; i < 200.0; i++) {
                  rain += rainDrop(uv, uTime, i * 12.34);
              }
              
              // Adjust intensity based on density setting
              rain *= (uRainDensity / 200.0);
              
              // Zelda-style rain color (bright and visible)
              vec3 rainColor = vec3(0.85, 0.9, 1.0);
              
              gl_FragColor = vec4(rainColor * rain, rain * 0.8);
          }
      `;

  // Create WebGL program
  const glProgram = new GlProgram({ vertex: vertexSrc, fragment: fragmentSrc });

  // Uniform group for shader parameters
  const uniformGroup = new UniformGroup({
    uTime: { value: 0, type: "f32" },
    uResolution: { value: resolutionSignal(), type: "vec2<f32>" },
    uRainSpeed: { value: speedSignal(), type: "f32" },
    uWindDirection: { value: windDirectionSignal(), type: "f32" },
    uWindStrength: { value: windStrengthSignal(), type: "f32" },
    uRainDensity: { value: densitySignal(), type: "f32" },
  });

  // Create shader with program and resources
  const shader = new Shader({
    glProgram,
    resources: {
      uniforms: uniformGroup,
    },
  });

  // Full-screen quad geometry
  const geometry = new Geometry({
    attributes: {
      aPosition: [-1, -1, 1, -1, 1, 1, -1, 1],
      aUV: [0, 0, 1, 0, 1, 1, 0, 1],
    },
    indexBuffer: [0, 1, 2, 0, 2, 3],
  });

  // Animation loop - update time and reactive uniforms
  tick(({ deltaTime }) => {
    uniformGroup.uniforms.uTime += deltaTime;
    
    // Update uniforms from signals
    uniformGroup.uniforms.uRainSpeed = speedSignal();
    uniformGroup.uniforms.uWindDirection = windDirectionSignal();
    uniformGroup.uniforms.uWindStrength = windStrengthSignal();
    uniformGroup.uniforms.uRainDensity = densitySignal();
    uniformGroup.uniforms.uResolution = resolutionSignal();
  });

  return h(Mesh, {
    geometry,
    shader,
  });
};

// Export as Weather for easier usage
export const Weather = WeatherEffect;
