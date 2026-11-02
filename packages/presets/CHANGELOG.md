# @canvasengine/presets

## 2.5.0

### Minor Changes

- a76df21: Fx presets can describe a whole sequence. Emitters follow a keyframed `path`, emit `backward` / `forward` along its heading, start from another emitter's path with a `trigger`, and are cloned with `instances` (or groups). Five recipes (`charge`, `projectile`, `impact`, `mist`, `circle`) expand into tuned emitters, and `expandFxPreset` resolves everything into plain emitters. Existing presets are unchanged.
