# Canvas Engine

CanvasEngine is a reactive 2D game framework built on PixiJS, Vite, and `.ce` components.

Use it to build platformers, top-down RPGs, arcade games, mobile prototypes, interactive scenes, and game UIs without wiring every low-level rendering and input system yourself.

## Start in minutes

Install CanvasEngine, create a `.ce` component, and bootstrap it in your Vite app.

- [Installation](/get_started/installation)
- [Start guide](/get_started/start)

```html
<Canvas backgroundColor="#101820">
  <Text
    text="Hello CanvasEngine"
    x={40}
    y={40}
    size={32}
    color="#ffffff"
  />
</Canvas>
```

## Build the game, not the engine

CanvasEngine gives you a component-oriented way to describe scenes, entities, HUDs, menus, effects, and interactions. Start with a simple canvas scene, then add maps, player controls, sound feedback, weather, night ambience, particles, and DOM UI as your game grows.

## Game systems included

### Worlds

- [Tilemap support](/presets/tilemap) with Tiled Map Editor integration.
- [Viewport](/components/viewport) pan, zoom, clamping, and culling for large 2D worlds.
- Object layers, animated tiles, and map-driven scene composition.

### Feedback

- [Fx particles](/presets/fx) for hits, sparks, smoke, magic, fire, pickups, and explosions.
- [Sound directive](/directives/sound) and audio system for effects, feedback, and ambience.
- Flash, shake, animation, and trigger-based interactions.

### Input

- [Controls directive](/directives/controls) for keyboard and gamepad input.
- [Virtual joystick](/components/joystick) for mobile-friendly controls.
- [Drag and drop](/directives/drag) for pointer-driven gameplay and editor-like interactions.

### UI and ambience

- Reactive [Text](/components/text), [Button](/components/button), [Sprite](/components/sprite), [Graphics](/components/graphic), and layout components.
- [DOMContainer](/components/dom-container) for mixing HTML overlays, menus, forms, and UI panels with canvas scenes.
- [Weather presets](/presets/weather), [NightAmbient](/presets/night-ambiant), fog of war, shadows, and footprints for world atmosphere.

## Use with AI

Install the CanvasEngine skill so your AI coding assistant understands the framework, its `.ce` component syntax, and the recommended game-building patterns.

```bash
npx skills add https://github.com/RSamaium/CanvasEngine
```

Then ask your assistant things like:

> create mario style game

The skill gives the assistant CanvasEngine-specific context so it can generate scenes, controls, tilemaps, FX particles, sound, joystick input, weather, DOM overlays, and reactive game logic more accurately.
