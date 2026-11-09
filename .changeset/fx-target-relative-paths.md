---
"@canvasengine/presets": minor
---

Fx presets can fly from a caster to a target. A path with `pathSpace: 'target'` maps its keys to the caster-to-target line (`x`: 0 = caster, 1 = target, `y`: perpendicular, as fractions of the distance), an emitter or recipe with `at: 'target'` is placed on the target, and the target comes from `runtime.spawn(container, preset, { target })`, the `<Fx target>` prop or `trigger.start({ target })`. Triggers, `direction` and `instances` work on the mapped path, and without a target a 200 px reference to the right keeps the preset previewable. `customizeFx` takes the target as a third argument. Existing presets are unchanged.
