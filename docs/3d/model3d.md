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
| `morphWeights` | `number[]` \| `{ [meshLabel]: number[] }` | Morph target weights (see [Morph Targets](#morph-targets)) |
| `unload` | `boolean` | Unloads the file from memory when no `Model3D` uses it any more. Default `true` |
| `dissolve` | `number` \| object | Cuts the model away with noise (see [Dissolve](#dissolve)) |
| `onAnimationEnd` | `(clip) => void` | Called when a clip that does not loop reaches its end |
| `onAnimationLoop` | `(clip) => void` | Called each time a looping clip starts over |
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

`onAnimationEnd` tells when such a clip is over, for example to go back to `"Idle"` after an attack:

```html
<Model3D src="./models/robot.glb" animation={clip} loop={looping} onAnimationEnd={onEnd} />

<script>
  import { signal, computed } from "canvasengine";

  const ONE_SHOT = ["Punch", "Jump", "Death"];
  const clip = signal("Idle");
  const looping = computed(() => !ONE_SHOT.includes(clip()));

  function onEnd(name) {
    if (name !== "Death") clip.set("Idle");
  }
</script>
```

`onAnimationLoop` is called each time a looping clip wraps around, for example to play a footstep sound.

## Facing and Size

- glTF models face **+Z**. To turn a model toward its direction of travel `(dx, dz)`, use `rotation={[0, Math.atan2(dx, dz), 0]}`.
- The file already sets its size and its "up" direction: do not add a correction rotation. Check the size with `model.getLocalBounds()` in `onLoad` before scaling it.

## Attaching to a Bone

A child component with `bone` follows that bone of the model: a sword in a hand, a hat on a head. Its `position`, `rotation` and `scale` are an offset from the bone, in the model's units and axes:

```html
<Model3D src="./models/robot.glb" animation="Wave">
  <Mesh3D
    bone="Head"
    geometry={{ type: "cone", radius: 0.6, height: 0.9 }}
    material={{ type: "toon", baseColor: 0xd9534f }}
    position={[0, 1.9, 0]}
  />
</Model3D>
```

Bones work whether they are nodes of the model's scene (often the upper bones, such as `Head`) or exist only in its skeleton (often hands and fingers). If the name is not found, a warning lists every bone name of the model.

A sword in a hand, pointing forward when the robot stands still:

```html
<Model3D src="./models/robot.glb" animation={clip}>
  <Group3D bone="Palm2.R" rotation={[Math.PI / 2, 0, 0]}>
    <Mesh3D geometry={{ type: "cylinder", radiusTop: 0.07, radiusBottom: 0.07, height: 0.5 }} material={{ baseColor: 0x5a3a1a }} />
    <Mesh3D geometry={{ type: "cube", width: 0.14, height: 1.8, depth: 0.04 }} material={{ baseColor: 0xd8dde3, metallic: 1 }} position={[0, 1.2, 0]} />
  </Group3D>
</Model3D>
```

The offset is read in the model's axes in the pose the model has when the child attaches; the bone then turns it with every animation. Use a `Group3D` to attach a multi-part object and turn it as a whole.

## Morph Targets

Morph targets reshape a mesh, often for facial expressions. `morphWeights` sets their weights, from 0 to 1:

```html
<Model3D src="./models/robot.glb" animation="Idle" morphWeights={face} />

<script>
  import { signal } from "canvasengine";

  // RobotExpressive has 3 face morph targets
  const face = signal([0, 1, 0]);
</script>
```

An array applies to every mesh with morph targets; `{ meshLabel: [...] }` targets one mesh. While `morphWeights` is set, it wins over a clip that animates the weights.

## Dissolve

`dissolve` cuts the model away with noise, for a death, a teleport or an appearance: `0` draws it whole, `1` makes it disappear. Give an edge colour for a glowing border along the cut:

```html
<Model3D src="./models/robot.glb" dissolve={{ amount: fade, edgeColor: 0xff8a3d, edgeStrength: 6, holeSize: 25 }} />

<script>
  import { signal, tick } from "canvasengine";

  const fade = signal(0);
  tick(({ deltaTime }) => fade.update((v) => Math.min(1, v + deltaTime / 2000)));
</script>
```

| Option | Description |
|--------|-------------|
| `amount` | `0` whole, `1` gone. A plain number is the amount |
| `edgeColor` | Colour of the glowing edge. Default: no edge |
| `edgeStrength` | Brightness of the edge; above 1 it glows and feeds [bloom](./effects). Default `4` |
| `holeSize` | About how wide the holes are, in the model's own units. Default `0.25`. A model stored in centimetres (RobotExpressive) needs about `25` |

The first time `dissolve` is set, the model gets its own copy of its materials: other models from the same file are not affected.

::: warning
Shadows and outlines don't dissolve: a half-dissolved model still casts its whole shadow. Objects attached with `bone` keep their own materials; give them a `dissolve` of their own.
:::

## Compressed Models

glTF files compressed with meshopt or quantization load as is. Draco-compressed files fetch a decoder, by default from Google's servers. To host it yourself, call this before loading the first Draco file:

```js
import { setDracoDecoderPath } from "@canvasengine/3d";

setDracoDecoderPath({
  jsUrl: "/draco/draco_wasm_wrapper.js",
  wasmUrl: "/draco/draco_decoder.wasm",
});
```

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
