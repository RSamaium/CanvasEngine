/**
 * Gradient alpha for projected sprite shadows.
 * Strong alpha near the caster's feet (vTextureCoord.y ~ 1),
 * softer alpha at the shadow tip (vTextureCoord.y ~ 0).
 */
precision highp float;
precision highp int;

in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uPower;
uniform float uFloor;

void main() {
  vec4 color = texture(uTexture, vTextureCoord);
  float gradient = pow(clamp(vTextureCoord.y, 0.0, 1.0), max(0.001, uPower));
  float alphaMul = mix(clamp(uFloor, 0.0, 1.0), 1.0, gradient);
  finalColor = vec4(color.rgb, color.a * alphaMul);
}
