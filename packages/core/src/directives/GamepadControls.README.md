# GamepadControls Directive

La directive `gamepadControls` permet d'utiliser une manette de jeu (gamepad) avec votre application Canvas Engine. Elle utilise la bibliothèque `joypad.js` pour gérer la détection et les événements des manettes.

## Fonctionnalités

- ✅ Détection automatique de connexion/déconnexion des manettes
- ✅ Support des boutons de manette standards (Xbox, PlayStation, etc.)
- ✅ Support des sticks analogiques avec détection de direction
- ✅ Intégration avec les contrôles clavier existants (même API)
- ✅ Notifications visuelles de connexion/déconnexion
- ✅ Configuration flexible des mappings de boutons
- ✅ Support des actions répétées (maintien de bouton)

## Installation

La directive est automatiquement disponible quand vous importez Canvas Engine. La dépendance `joypad.js` est incluse dans le package core.

## Utilisation de base

### HTML/Template

```html
<div 
    data-controls="true"
    data-gamepad-controls="true"
    :controls="keyboardControls"
    :gamepad-controls="gamepadControls"
    :gamepad-options="gamepadOptions"
>
    <!-- Votre contenu de jeu -->
</div>
```

### Configuration JavaScript/TypeScript

```typescript
import { GamepadInput } from 'canvasengine'

// Configuration des contrôles gamepad
const gamepadControls = {
    // Directions avec D-pad et stick analogique gauche
    up: {
        bind: [GamepadInput.Button12, GamepadInput.LeftStickUp],
        repeat: true
    },
    down: {
        bind: [GamepadInput.Button13, GamepadInput.LeftStickDown],
        repeat: true
    },
    left: {
        bind: [GamepadInput.Button14, GamepadInput.LeftStickLeft],
        repeat: true
    },
    right: {
        bind: [GamepadInput.Button15, GamepadInput.LeftStickRight],
        repeat: true
    },
    
    // Actions principales
    action: {
        bind: GamepadInput.Button0, // Bouton A (Xbox) / X (PlayStation)
    },
    back: {
        bind: GamepadInput.Button1, // Bouton B (Xbox) / Circle (PlayStation)
    }
}

// Options de notification
const gamepadOptions = {
    connect: {
        message: 'Manette connectée !',
        time: 2000,
        sound: 'connect'
    },
    disconnect: {
        message: 'Manette déconnectée !',
        time: 2000,
        sound: 'disconnect'
    }
}
```

## Mapping des boutons

### Xbox One/Series X|S

```typescript
const xboxMapping = {
    A: GamepadInput.Button0,
    B: GamepadInput.Button1,
    X: GamepadInput.Button2,
    Y: GamepadInput.Button3,
    LB: GamepadInput.Button4,
    RB: GamepadInput.Button5,
    LT: GamepadInput.Button6,
    RT: GamepadInput.Button7,
    Back: GamepadInput.Button8,
    Start: GamepadInput.Button9,
    LeftStick: GamepadInput.Button10,
    RightStick: GamepadInput.Button11,
    DPadUp: GamepadInput.Button12,
    DPadDown: GamepadInput.Button13,
    DPadLeft: GamepadInput.Button14,
    DPadRight: GamepadInput.Button15
}
```

### PlayStation 4/5

```typescript
const playstationMapping = {
    X: GamepadInput.Button0,        // Bouton du bas
    Circle: GamepadInput.Button1,   // Bouton de droite
    Square: GamepadInput.Button2,   // Bouton de gauche
    Triangle: GamepadInput.Button3, // Bouton du haut
    L1: GamepadInput.Button4,
    R1: GamepadInput.Button5,
    L2: GamepadInput.Button6,
    R2: GamepadInput.Button7,
    Share: GamepadInput.Button8,
    Options: GamepadInput.Button9,
    L3: GamepadInput.Button10,
    R3: GamepadInput.Button11,
    DPadUp: GamepadInput.Button12,
    DPadDown: GamepadInput.Button13,
    DPadLeft: GamepadInput.Button14,
    DPadRight: GamepadInput.Button15
}
```

## Sticks analogiques

La directive supporte également les sticks analogiques :

```typescript
const analogControls = {
    // Stick gauche
    moveUp: { bind: GamepadInput.LeftStickUp },
    moveDown: { bind: GamepadInput.LeftStickDown },
    moveLeft: { bind: GamepadInput.LeftStickLeft },
    moveRight: { bind: GamepadInput.LeftStickRight },
    
    // Stick droit (pour la caméra par exemple)
    lookUp: { bind: GamepadInput.RightStickUp },
    lookDown: { bind: GamepadInput.RightStickDown },
    lookLeft: { bind: GamepadInput.RightStickLeft },
    lookRight: { bind: GamepadInput.RightStickRight }
}
```

## Intégration avec les contrôles clavier

Les contrôles gamepad utilisent exactement la même API que les contrôles clavier. Vous pouvez donc utiliser les mêmes noms d'actions :

```typescript
// Configuration clavier
const keyboardControls = {
    up: { bind: ['up', 'w'], repeat: true },
    down: { bind: ['down', 's'], repeat: true },
    action: { bind: 'space' },
    back: { bind: 'escape' }
}

// Configuration gamepad - mêmes noms d'actions
const gamepadControls = {
    up: { bind: GamepadInput.LeftStickUp, repeat: true },
    down: { bind: GamepadInput.LeftStickDown, repeat: true },
    action: { bind: GamepadInput.Button0 },
    back: { bind: GamepadInput.Button1 }
}
```

## Événements personnalisés

Vous pouvez définir des méthodes personnalisées pour gérer les actions :

```typescript
const customControls = {
    jump: {
        bind: GamepadInput.Button0,
        method({ actionName }) {
            console.log('Jump with gamepad!', actionName)
            // Votre logique de saut ici
        }
    },
    
    attack: {
        bind: GamepadInput.Button2,
        method({ actionName }) {
            console.log('Attack with gamepad!', actionName)
            // Votre logique d'attaque ici
        }
    }
}
```

## API de la directive

### Propriétés

- `connected: boolean` - Indique si une manette est connectée
- `options: Controls` - Configuration actuelle des contrôles

### Méthodes

- `applyControl(controlName, isDown?)` - Déclenche une action de contrôle
- `getControl(inputName)` - Récupère les informations d'un contrôle
- `getControls()` - Récupère tous les contrôles
- `stopInputs()` - Arrête l'écoute des entrées
- `listenInputs()` - Reprend l'écoute des entrées
- `setInputs(inputs)` - Configure les mappings de contrôles

## Notes importantes

1. **Compatibilité navigateur** : Le support gamepad varie selon les navigateurs. Chrome et Firefox ont le meilleur support.

2. **Activation utilisateur** : Les navigateurs modernes nécessitent une interaction utilisateur (clic, touche) avant de pouvoir détecter les manettes.

3. **Détection** : La manette doit être connectée ET un bouton doit être pressé pour être détectée par le navigateur.

4. **Mapping boutons** : Le mapping des boutons peut varier selon la marque de manette et le navigateur. Testez toujours avec vos manettes cibles.

## Dépannage

### La manette n'est pas détectée

1. Vérifiez que la manette est bien connectée (USB ou Bluetooth)
2. Appuyez sur un bouton de la manette après connexion
3. Vérifiez la console pour les messages de connexion
4. Testez avec https://html5gamepad.com/ pour vérifier la détection du navigateur

### Les boutons ne correspondent pas

1. Consultez la console pour voir les codes de boutons détectés
2. Utilisez les outils de développement du navigateur
3. Adaptez les mappings selon votre manette spécifique

### Événements multiples

Si vous utilisez à la fois clavier et gamepad, les événements peuvent se dupliquer. C'est normal - les deux directives sont indépendantes mais déclenchent les mêmes actions.

## Support

Pour plus d'informations sur l'API Gamepad du navigateur :
- [MDN Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)
- [joypad.js Documentation](https://github.com/ArunMichaelDsouza/joypad.js)