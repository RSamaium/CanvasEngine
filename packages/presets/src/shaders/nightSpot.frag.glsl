/**
 * Night + spot light + fog fragment shader.
 * - Darkens the scene and adds a circular lit area (spot) around uLightPos.
 * - Fog blends toward uFogColor beyond uFogRadius (distance from player in 0-1).
 * uLightPos is in normalized screen space (0-1) so it works correctly with viewport.
 */
in vec2 vTextureCoord;

out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec2 uLightPos;
uniform float uRadius;
uniform float uDarkness;
uniform vec3 uFogColor;
uniform float uFogRadius;
uniform float uFogSoftness;

void main() {
  vec4 color = texture(uTexture, vTextureCoord);

  // Distance from current pixel to light position (both in 0-1 screen space)
  float dist = distance(vTextureCoord, uLightPos);
  float spot = 1.0 - smoothstep(0.0, uRadius, dist);

  // Night: full brightness at spot center, darker outside
  float factor = spot + (1.0 - spot) * (1.0 - uDarkness);
  color.rgb *= factor;

  // Fog: blend toward fog color beyond visibility radius
  float fogFactor = smoothstep(uFogRadius, uFogRadius + uFogSoftness, dist);
  color.rgb = mix(color.rgb, uFogColor, fogFactor);

  finalColor = color;
}
