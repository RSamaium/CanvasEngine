export interface SunShadowOptions {
  /** Hour of sunrise. Default: `6` */
  sunrise?: number;
  /** Hour of sunset. Default: `18.5` */
  sunset?: number;
  /** Highest sun elevation at noon, in degrees. Default: `62` */
  maxElevation?: number;
  /** Shadow strength in full daylight. Default: `1` */
  intensity?: number;
  /** Faint moonlight shadows at night (`0` = none). Default: `0.22` */
  moonlight?: number;
  /**
   * Where the short noon shadow points. `south` (default) keeps shadows in front of
   * characters, readable in top-down views; `north` is the physical northern-hemisphere sun.
   */
  noonShadow?: "south" | "north";
}

/**
 * Ambient light for `SpriteShadows` following the sun across the day.
 * Morning shadows stretch west, noon shadows are short (pointing south by default,
 * so characters do not hide them), evening shadows stretch east.
 * At night a faint moonlight can keep sprites grounded.
 *
 * @example
 * ```html
 * <SpriteShadows ambientLight={sun} lights={lampLights} />
 * <script>
 *   const sun = computed(() => sunShadowAt(clock.time()))
 * </script>
 * ```
 */
export function sunShadowAt(hour: number, options: SunShadowOptions = {}) {
  const sunrise = options.sunrise ?? 6;
  const sunset = options.sunset ?? 18.5;
  const maxElevation = ((options.maxElevation ?? 62) * Math.PI) / 180;
  const h = ((hour % 24) + 24) % 24;
  const vertical = options.noonShadow === "north" ? -1 : 1;
  const dayProgress = (h - sunrise) / (sunset - sunrise);

  if (dayProgress > 0 && dayProgress < 1) {
    const arc = Math.sin(Math.PI * dayProgress);
    const elevation = Math.max(0.05, arc * maxElevation);
    // Shadow direction: west (-x) at sunrise, south/north at noon, east (+x) at sunset
    const shadowX = -Math.cos(Math.PI * dayProgress);
    const shadowY = vertical * Math.sin(Math.PI * dayProgress);
    const strength = Math.min(1, arc / 0.18);
    return {
      x: -shadowX,
      y: -shadowY,
      // SpriteShadows derives the length from caster height and light height
      z: Math.max(18, 220 * Math.tan(elevation)),
      intensity: (options.intensity ?? 1) * strength,
      shadowWeight: 1,
    };
  }

  const moonlight = options.moonlight ?? 0.22;
  const nightLength = (24 - sunset + sunrise) || 1;
  const nightProgress = (((h - sunset) % 24) + 24) % 24 / nightLength;
  const arc = Math.sin(Math.PI * nightProgress);
  return {
    x: Math.cos(Math.PI * nightProgress),
    y: -vertical * Math.sin(Math.PI * nightProgress),
    z: Math.max(40, 220 * Math.tan(Math.max(0.1, arc) * 0.8)),
    intensity: moonlight * Math.min(1, arc / 0.25),
    shadowWeight: 1,
  };
}
