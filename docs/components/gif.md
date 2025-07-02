# Gif Component

Le composant `Gif` permet d'afficher et de contrôler des animations GIF dans votre application PixiJS. Il hérite directement de `GifSprite` de PixiJS.

## Prérequis

Ce composant nécessite l'installation du plugin `@pixi/gif` :

```bash
npm install @pixi/gif
```

Le plugin doit être installé et configuré avec PixiJS pour que `GifSprite` soit disponible dans l'import `pixi.js`.

## Basic GIF:

```html
<Gif 
    src="./path/to/animation.gif" 
    x={100} 
    y={100} 
/>
```

## GIF with Controls:

```html
<Gif 
    src="./path/to/animation.gif"
    x={100}
    y={100}
    animationSpeed={1.5}
    loop={true}
    autoPlay={true}
    onComplete={() => console.log('Animation terminée')}
    onFrameChange={(frame) => console.log('Frame:', frame)}
/>
```

## Programmatic Control:

```html
<script>
let gifRef;

const play = () => gifRef?.play();
const stop = () => gifRef?.stop();
const goToFrame = (frame) => gifRef?.gotoAndPlay(frame);
</script>

<Gif 
    bind:this={gifRef}
    src="./assets/character-walk.gif"
    x={200}
    y={200}
    autoPlay={false}
/>

<button onclick={play}>Play</button>
<button onclick={stop}>Stop</button>
<button onclick={() => goToFrame(5)}>Go to Frame 5</button>
```

## Frame Control:

```html
<Gif 
    src="./animation.gif"
    currentFrame={10}
    playing={false}
    onFrameChange={(frame) => {
        console.log('Current frame:', frame);
    }}
/>
```

## Gif Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `src` | `string` | Chemin vers le fichier GIF (requis) | - |
| `animationSpeed` | `number` | Vitesse de l'animation (1 = vitesse normale, 0.5 = moitié, 2 = double) | `1` |
| `loop` | `boolean` | Si l'animation doit boucler | `true` |
| `autoPlay` | `boolean` | Si l'animation doit démarrer automatiquement | `true` |
| `playing` | `boolean` | Contrôle la lecture/pause de l'animation | - |
| `currentFrame` | `number` | Frame actuelle à afficher | - |
| `onComplete` | `() => void` | Callback appelé quand l'animation se termine | - |
| `onFrameChange` | `(frame: number) => void` | Callback appelé à chaque changement de frame | - |
| `onLoop` | `() => void` | Callback appelé à chaque boucle de l'animation | - |

## Méthodes de contrôle

Le composant hérite directement des méthodes de `GifSprite` :

```javascript
// Contrôles (méthodes héritées de GifSprite)
gifRef.play();           // Démarrer l'animation
gifRef.stop();           // Arrêter l'animation
gifRef.gotoAndPlay(5);   // Aller à la frame 5 et jouer
gifRef.gotoAndStop(10);  // Aller à la frame 10 et s'arrêter
```

## Propriétés disponibles

```javascript
// Propriétés héritées de GifSprite (accès direct)
const duration = gifRef.duration;      // Durée totale
const currentFrame = gifRef.currentFrame; // Frame actuelle
const totalFrames = gifRef.totalFrames;   // Nombre total de frames
const playing = gifRef.playing;           // État de lecture
const animationSpeed = gifRef.animationSpeed; // Vitesse d'animation
const loop = gifRef.loop;               // État de boucle

// Callbacks disponibles
gifRef.onComplete = () => console.log('Animation terminée');
gifRef.onFrameChange = (frame) => console.log('Frame:', frame);
gifRef.onLoop = () => console.log('Boucle');
```

## Exemple complet

```html
<script>
import { Gif } from '@your-package/core';

let isPlaying = true;
let currentFrame = 0;

const togglePlay = () => {
    isPlaying = !isPlaying;
};
</script>

<div>
    <Gif 
        src="./assets/character-walk.gif"
        x={200}
        y={200}
        animationSpeed={1.5}
        loop={true}
        playing={isPlaying}
        onFrameChange={(frame) => currentFrame = frame}
        onComplete={() => console.log('Cycle terminé')}
    />
    
    <button onclick={togglePlay}>
        {isPlaying ? "Pause" : "Play"}
    </button>
    
    <p>Frame: {currentFrame}</p>
</div>
```

## Notes techniques

- **Héritage direct** : Le composant `CanvasGif` hérite directement de `GifSprite` de PixiJS
- Import direct : `import { GifSprite } from 'pixi.js'`
- Utilise exclusivement `GifSprite` - pas de fallback
- Les GIF sont chargés de manière asynchrone via :
  - `GifSprite.fromURL()` pour les URLs
  - `GifSprite.fromBuffer()` pour les buffers de données
- **Copie des propriétés** : Les données du GIF chargé sont copiées sur l'instance du composant
- Le composant gère automatiquement le nettoyage des ressources
- Compatible avec toutes les props de `DisplayObject` (position, rotation, scale, etc.)
- API native PixiJS : accès direct aux méthodes et propriétés de `GifSprite`

<!-- @include: ./_display-object.md -->