# Composant Gif

Le composant `Gif` permet d'afficher et de contrôler des animations GIF dans votre application PixiJS. Il supporte à la fois `GifSprite` et `AnimatedGIF` du plugin `@pixi/gif`.

## Prérequis

Ce composant nécessite l'installation du plugin `@pixi/gif` :

```bash
npm install @pixi/gif
```

Puis l'importer dans votre application :

```javascript
import '@pixi/gif';
```

Le composant détectera automatiquement quelle classe est disponible (`GifSprite` ou `AnimatedGIF`) et l'utilisera en conséquence.

## Utilisation de base

```typescript
import { Gif } from '@your-package/core';

// Utilisation simple
<Gif 
  src="./path/to/your/animation.gif" 
  x={100} 
  y={100} 
/>

// Avec contrôles avancés
<Gif 
  src="./path/to/your/animation.gif"
  x={100}
  y={100}
  animationSpeed={0.5}
  loop={true}
  autoPlay={true}
  onComplete={() => console.log('Animation terminée')}
  onFrameChange={(frame) => console.log('Frame:', frame)}
/>
```

## Props

| Prop | Type | Description | Défaut |
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

Vous pouvez accéder aux méthodes de contrôle via une référence au composant :

```typescript
const gifRef = useRef<CanvasGif>();

// Contrôles
gifRef.current?.play();           // Démarrer l'animation
gifRef.current?.stop();           // Arrêter l'animation
gifRef.current?.gotoAndPlay(5);   // Aller à la frame 5 et jouer
gifRef.current?.gotoAndStop(10);  // Aller à la frame 10 et s'arrêter
```

## Propriétés en lecture seule

```typescript
// Informations sur l'animation
const duration = gifRef.current?.duration;      // Durée totale
const currentFrame = gifRef.current?.currentFrame; // Frame actuelle
const totalFrames = gifRef.current?.totalFrames;   // Nombre total de frames
const isPlaying = gifRef.current?.isPlaying;       // État de lecture
```

## Exemple complet

```typescript
import { Gif } from '@your-package/core';
import { useState } from 'react';

function AnimatedCharacter() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);

  return (
    <Container>
      <Gif 
        src="./assets/character-walk.gif"
        x={200}
        y={200}
        animationSpeed={1.5}
        loop={true}
        playing={isPlaying}
        onFrameChange={setCurrentFrame}
        onComplete={() => console.log('Cycle terminé')}
      />
      
      <Button 
        x={50} 
        y={50}
        text={isPlaying ? "Pause" : "Play"}
        onClick={() => setIsPlaying(!isPlaying)}
      />
      
      <Text
        x={50}
        y={100}
        text={`Frame: ${currentFrame}`}
      />
    </Container>
  );
}
```

## Notes techniques

- Le composant utilise le plugin `@pixi/gif` et supporte automatiquement :
  - `GifSprite` - classe recommandée pour les nouvelles implémentations
  - `AnimatedGIF` - classe legacy, mais toujours supportée
- Détection automatique de la classe disponible au runtime
- Les GIF sont chargés de manière asynchrone via différentes méthodes :
  - `fromURL()` pour les URLs
  - `fromBuffer()` pour les buffers de données
  - Constructeur avec texture en fallback
- Le composant gère automatiquement le nettoyage des ressources
- Compatible avec toutes les props de `DisplayObject` (position, rotation, scale, etc.)
- Support des méthodes optionnelles (certaines propriétés peuvent ne pas être disponibles selon la classe utilisée)