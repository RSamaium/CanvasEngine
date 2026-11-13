# Model3D

`Model3D` loads a glTF model (`.glb` or `.gltf`) and plays its animation clips.

## Basic Usage

```html
<Model3D
  src="./models/robot.glb"
  position={[0, 0, 0]}
  animation="Idle"
  castShadow={true}
/>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `src` | `string` \| `Scene3DSource` | URL of the file, or a source already loaded with `Assets.load` |
| `animation` | `string` \| `null` | Name of the clip to play. `null` stops playback |
| `fadeDuration` | `number` | Cross-fade time in **seconds** when `animation` changes. Default `0.25`; `0` switches at once |
| `loop` | `boolean` | Whether the clip loops. Default `true` |
| `animationSpeed` | `number` | Playback speed. Default `1`; negative values play backwards |
| `castShadow` | `boolean` | Casts shadows |
| `receiveShadow` | `boolean` | Shows shadows cast on it |
| `onLoad` | `(model) => void` | Called once the model is built, with the [`@pixi/3d` Model3D](https://3d.pixijs.download/release/docs/scene.Model3D.html) |

Plus the [common props](./getting-started#common-props): `position`, `rotation`, `scale`, events...

The transform props apply right away, before the file has loaded. Changing `src` loads the new file and replaces the model.

## Animations

Only the clip named by `animation` plays: nothing starts on its own. Changing the prop cross-fades from the current clip to the new one.

A typical character switches clips from its state:

```html
<Model3D
  src="./models/robot.glb"
  position={position}
  rotation={[0, heading, 0]}
  animation={clip}
  fadeDuration={0.3}
/>

<script>
  import { signal, computed } from "canvasengine";

  const moving = signal(false);
  const running = signal(false);

  const clip = computed(() => {
    // Read every signal before the conditions (see the warning below)
    const [isMoving, isRunning] = [moving(), running()];
    if (!isMoving) return "Idle";
    return isRunning ? "Running" : "Walking";
  });
</script>
```

::: warning A computed tracks the signals read on its first run
A `computed` only reacts to the signals it read **the first time it ran**. In `moving() ? (running() ? "Running" : "Walking") : "Idle"`, `running()` is not read while `moving()` is `false`, so the clip never switches to `"Running"`. Read every signal at the top of the function, as above.
:::

The clip names come from the file. If you don't know them, list them in `onLoad`:

```js
function onLoad(model) {
  console.log(Object.keys(model.source.animations));
  // ["Dance", "Idle", "Running", "Walking", ...]
}
```

A name that does not exist in the file logs a warning and stops playback.

### One-shot Clips

For an action that should not loop (attack, jump, death), set `loop={false}`: the clip plays once.

```html
<!-- The compiler turns the expression into a computed: it updates with `clip` -->
<Model3D src="./models/robot.glb" animation={clip} loop={clip !== "Death"} />
```

## Facing and Size

- glTF models face **+Z**. To turn a model toward its direction of travel `(dx, dz)`, use `rotation={[0, Math.atan2(dx, dz), 0]}`.
- The file already sets its size and its "up" direction: do not add a correction rotation. Check the size with `model.getLocalBounds()` in `onLoad` before scaling it.

## Advanced Access

`onLoad` gives the `@pixi/3d` model, for what the props do not cover: bones (`model.skeletons`), morph targets, per-model materials, several clips blended by weight (`model.player`).

```js
function onLoad(model) {
  // Give this model its own copy of the materials, then tint it
  model.materials = (material) => material.clone();
}
```

## Example

The playground example `3d-model` (in the `sample` folder) shows a character that walks with the arrow keys, runs with Shift and plays gestures from 2D buttons.
