# Use Video component

```html
<Video src="myvideo.mp4" play={true} />
```

## Props

- `src`: string
- `paused`: boolean
- `loop`: boolean
- `muted`: boolean

- `loader`: {
    - `onComplete`: (texture: Texture) => void;
    - `onProgress`: (progress: number) => void;
}


## Events

- `play`: () => void;
- `pause`: () => void;
- `ended`: () => void;
- `progress`: (progress: number) => void;
