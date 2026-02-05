/**
 * Night + spot light + fog fragment shader.
 * - Supports multiple circular spots (uSpots) in screen-pixel space.
 * - Each spot is vec4(xPx, yPx, radiusPx, intensity).
 * - Fog is based on the nearest light source so illuminated areas stay readable.
 * - Dark zones are tinted with uDarkColor for colored night effects.
 */
precision highp float;
precision highp int;

in vec2 vTextureCoord;

out vec4 finalColor;

uniform sampler2D uTexture;
uniform highp vec4 uInputSize;
uniform vec4 uSpots[24];
uniform float uDarkness;
uniform vec3 uDarkColor;
uniform vec3 uFogColor;
uniform float uFogRadius;
uniform float uFogSoftness;

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

  // Night: full brightness where light is strong, darker elsewhere.
  // Apply dark color tint in unlit areas.
  float factor = mix(1.0 - uDarkness, 1.0, light);
  vec3 darkened = color.rgb * factor;
  // Blend towards dark color in unlit areas (when factor < 1)
  float darkTint = (1.0 - factor) * uDarkness;
  color.rgb = mix(darkened, uDarkColor, darkTint);

  // Fog fades in with distance to nearest light, but less inside lit areas.
  float fogFactor = smoothstep(uFogRadius, uFogRadius + uFogSoftness, nearestDist);
  fogFactor *= (1.0 - light * 0.7);
  color.rgb = mix(color.rgb, uFogColor, clamp(fogFactor, 0.0, 1.0));

  finalColor = color;
}
