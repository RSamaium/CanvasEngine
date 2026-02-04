/**
 * Night + spot light + fog fragment shader.
 * - Supports multiple circular spots (uSpots) in normalized screen space.
 * - Each spot is vec4(x, y, radius, intensity).
 * - Fog is based on the nearest light source so illuminated areas stay readable.
 */
in vec2 vTextureCoord;

out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uSpots[24];
uniform float uAspect;
uniform float uDarkness;
uniform vec3 uFogColor;
uniform float uFogRadius;
uniform float uFogSoftness;

void main() {
  vec4 color = texture(uTexture, vTextureCoord);
  float light = 0.0;
  float nearestDist = 1.0;

  for (int i = 0; i < 24; i++) {
    vec4 spotData = uSpots[i];
    vec2 lightPos = spotData.xy;
    float radius = max(spotData.z, 0.0001);
    float intensity = max(spotData.w, 0.0);
    if (intensity <= 0.0001) continue;

    vec2 delta = vTextureCoord - lightPos;
    delta.x *= uAspect;
    float dist = length(delta);
    float spot = (1.0 - smoothstep(0.0, radius, dist)) * intensity;
    light = clamp(light + spot, 0.0, 1.0);
    nearestDist = min(nearestDist, dist);
  }

  // Night: full brightness where light is strong, darker elsewhere.
  float factor = mix(1.0 - uDarkness, 1.0, light);
  color.rgb *= factor;

  // Fog fades in with distance to nearest light, but less inside lit areas.
  float fogFactor = smoothstep(uFogRadius, uFogRadius + uFogSoftness, nearestDist);
  fogFactor *= (1.0 - light * 0.7);
  color.rgb = mix(color.rgb, uFogColor, clamp(fogFactor, 0.0, 1.0));

  finalColor = color;
}
