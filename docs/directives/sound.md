# Sound Directive

The Sound directive allows you to add audio capabilities to your game elements in CanvasEngine. It integrates with the [Howler.js](https://howlerjs.com/) library to provide a powerful and flexible audio solution.

## Basic Usage

To use the Sound directive, add it to any element in your component:

```typescript
<Sprite 
  sound={{ 
    src: "explosion.mp3", 
    autoplay: true 
  }} 
  image="explosion.png" 
/>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `src` | `string` or `string[]` | Path(s) to the audio file(s) to be loaded |
| `autoplay` | `boolean` | Whether the sound should play automatically when loaded |
| `loop` | `boolean` | Whether the sound should loop indefinitely |
| `volume` | `number` | Initial volume from 0.0 to 1.0 |
| `playing` | `boolean` | Whether the sound is currently playing |
| `mute` | `boolean` | Whether the sound is muted |
| `seek` | `number` | The position to seek to in the sound (in seconds) |
| `rate` | `number` | The playback rate (speed) of the sound |

## Events

The Sound directive supports all Howler.js events:

| Event | Description |
|-------|-------------|
| `load` | Fires when the sound is loaded |
| `loaderror` | Fires when the sound fails to load |
| `playerror` | Fires when the sound fails to play |
| `play` | Fires when the sound begins playing |
| `end` | Fires when the sound finishes playing |
| `pause` | Fires when the sound is paused |
| `stop` | Fires when the sound is stopped |
| `mute` | Fires when the sound is muted/unmuted |
| `volume` | Fires when the sound's volume changes |
| `rate` | Fires when the sound's playback rate changes |
| `seek` | Fires when the sound is seeked |
| `fade` | Fires when the sound's volume fades |
| `unlock` | Fires when the sound is unlocked (mobile devices) |

## Reactive Usage

You can control sound properties reactively using signals:

```html
<script>
import { signal } from 'canvasengine'

const playing = false
const sound = signal({
  src: "exp.mp3",
  loop: false,
  volume: 1,
  playing
})

const toggleSound = () => {
  sound.update(val => ({ ...val, playing: !val.playing }))
}
</script>
<Sprite sound={sound} image="exp.png" click={toggleSound} />
```

## Spatial Sound

The Sound directive also supports spatial audio, where volume changes based on the listener's position:

```html
<Container>
  <Sprite soundListenerPosition={{ x: cameraX, y: cameraY }} />
  
  <Sprite 
    sound={{ 
      src: "ambient.mp3", 
      loop: true,
      spatial: {
        maxVolume: 1,
        maxDistance: 500
      }
    }} 
    x={position.x}
    y={position.y}
  />
</Container>

<script>
  import { signal } from 'canvasengine'

  const cameraX = signal(0)
  const cameraY = signal(0)
  const position = signal({ x: 0, y: 0 })
</script>
```

For spatial sound to work:
1. Add the `soundListenerPosition` directive to the camera or any other element that represents the listener's position
2. Add the `spatial` property to the sound configuration, which can include:
   - `maxVolume`: The maximum volume when the listener is at the sound's position
   - `maxDistance`: The distance at which the sound becomes inaudible