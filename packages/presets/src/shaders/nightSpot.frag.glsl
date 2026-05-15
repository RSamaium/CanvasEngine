/**
 * Night + spot light + haze fragment shader.
 * - Supports multiple circular spots (uSpots) in screen-pixel space.
 * - Each spot is vec4(xPx, yPx, radiusPx, intensity).
 * - Haze is based on the nearest light source so illuminated areas stay readable.
 * - Dark zones are tinted with uDarknessColor for colored night effects.
 */
precision highp float;
precision highp int;

in vec2 vTextureCoord;

out vec4 finalColor;

uniform sampler2D uTexture;
uniform highp vec4 uInputSize;
uniform vec4 uSpots[24];
uniform float uDarknessOpacity;
uniform vec3 uDarknessColor;
uniform vec3 uHazeColor;
uniform float uHazeRadius;
uniform float uHazeSoftness;
uniform float uHazeOpacity;

void main() {
  vec4 color = texture(uTexture, vTextureCoord);
  float light = 0.0;
  float nearestDist = 1.0;
  vec2 fragPx = vTextureCoord * uInputSize.xy;
  float minInputDim = max(min(uInputSize.x, uInputSize.y), 1.0);

  for (int i = 0; i < 24; i++) {
    vec4 spotData = uSpots[i];
    vec2 lightPosPx = spotData.xy;
    float radiusPx = max(spotData.z, 0.0001);
    float intensity = max(spotData.w, 0.0);
    if (intensity <= 0.0001) continue;

    vec2 deltaPx = fragPx - lightPosPx;
    float distPx = length(deltaPx);
    float spot = (1.0 - smoothstep(0.0, radiusPx, distPx)) * intensity;
    light = clamp(light + spot, 0.0, 1.0);
    nearestDist = min(nearestDist, distPx / minInputDim);
  }

  // Darkness is a color overlay outside spots. Spots punch through it.
  float darkMask = clamp((1.0 - light) * uDarknessOpacity, 0.0, 1.0);
  color.rgb = mix(color.rgb, uDarknessColor, darkMask);

  // Haze fades in with distance to nearest light, but less inside lit areas.
  float hazeFactor = smoothstep(uHazeRadius, uHazeRadius + uHazeSoftness, nearestDist);
  hazeFactor *= (1.0 - light * 0.7);
  hazeFactor *= clamp(uHazeOpacity, 0.0, 1.0);
  color.rgb = mix(color.rgb, uHazeColor, clamp(hazeFactor, 0.0, 1.0));

  finalColor = color;
}
