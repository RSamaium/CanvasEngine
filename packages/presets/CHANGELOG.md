# @canvasengine/presets

## 2.6.0

### Minor Changes

- 1d1bf47: Fx presets can fly from a caster to a target. A path with `pathSpace: 'target'` maps its keys to the caster-to-target line (`x`: 0 = caster, 1 = target, `y`: perpendicular, as fractions of the distance), an emitter or recipe with `at: 'target'` is placed on the target, and the target comes from `runtime.spawn(container, preset, { target })`, the `<Fx target>` prop or `trigger.start({ target })`. Triggers, `direction` and `instances` work on the mapped path, and without a target a 200 px reference to the right keeps the preset previewable. `customizeFx` takes the target as a third argument. Existing presets are unchanged.

## 2.5.0

### Minor Changes

- a76df21: Fx presets can describe a whole sequence. Emitters follow a keyframed `path`, emit `backward` / `forward` along its heading, start from another emitter's path with a `trigger`, and are cloned with `instances` (or groups). Five recipes (`charge`, `projectile`, `impact`, `mist`, `circle`) expand into tuned emitters, and `expandFxPreset` resolves everything into plain emitters. Existing presets are unchanged.
