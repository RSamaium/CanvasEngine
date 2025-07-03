# Controls Directive - Clavier et Gamepad

La directive `controls` (KeyboardControls) gère maintenant à la fois les entrées clavier et gamepad dans une seule directive unifiée. Elle utilise `joypad.js` pour la gestion des manettes.

## ✨ Fonctionnalités

- ✅ **Clavier** : Support complet des touches clavier (existant)
- ✅ **Gamepad** : Détection automatique des manettes de jeu
- ✅ **Unifiée** : Une seule directive pour les deux types d'entrée
- ✅ **Flexible** : Bind clavier ET gamepad sur la même action
- ✅ **Notifications** : Messages de connexion/déconnexion gamepad
- ✅ **Sticks analogiques** : Support des mouvements directionnels
- ✅ **Boutons standards** : Compatible Xbox, PlayStation, etc.

## 🚀 Utilisation de base

### Template HTML/JSX

```html
<div 
    data-controls="true"
    :controls="controlsConfiguration"
    :gamepad-options="gamepadOptions"
>
    <!-- Votre contenu de jeu -->
</div>
```

### Configuration TypeScript

```typescript
import { Input, GamepadInput } from 'canvasengine'

// Configuration unifiée - clavier ET gamepad
const controlsConfiguration = {
    // Mouvement - accepte clavier ET gamepad
    up: {
        bind: [
            Input.Up, 'w',                    // Clavier
            GamepadInput.Button12,            // Gamepad D-pad
            GamepadInput.LeftStickUp          // Gamepad stick
        ],
        repeat: true
    },
    
    // Action - multiple sources
    action: {
        bind: [
            Input.Space, Input.Enter,         // Clavier
            GamepadInput.Button0              // Gamepad bouton A/X
        ]
    }
}

// Options gamepad
const gamepadOptions = {
    connect: {
        message: 'Manette connectée ! 🎮',
        time: 2000
    },
    disconnect: {
        message: 'Manette déconnectée ❌',
        time: 2000
    }
}
```

## 🎮 Mapping des boutons gamepad

### Standard (Xbox layout)

```typescript
// Boutons face
GamepadInput.Button0  // A (Xbox) / X (PlayStation)
GamepadInput.Button1  // B (Xbox) / Circle (PlayStation)  
GamepadInput.Button2  // X (Xbox) / Square (PlayStation)
GamepadInput.Button3  // Y (Xbox) / Triangle (PlayStation)

// Gâchettes et bumpers
GamepadInput.Button4  // LB/L1
GamepadInput.Button5  // RB/R1
GamepadInput.Button6  // LT/L2
GamepadInput.Button7  // RT/R2

// Système
GamepadInput.Button8  // Back/Share
GamepadInput.Button9  // Start/Options

// Sticks (clic)
GamepadInput.Button10 // Left Stick Click (L3)
GamepadInput.Button11 // Right Stick Click (R3)

// D-pad
GamepadInput.Button12 // D-pad Up
GamepadInput.Button13 // D-pad Down
GamepadInput.Button14 // D-pad Left
GamepadInput.Button15 // D-pad Right
```

### Sticks analogiques

```typescript
// Stick gauche
GamepadInput.LeftStickUp
GamepadInput.LeftStickDown
GamepadInput.LeftStickLeft
GamepadInput.LeftStickRight

// Stick droit
GamepadInput.RightStickUp
GamepadInput.RightStickDown
GamepadInput.RightStickLeft
GamepadInput.RightStickRight
```

## 📋 Exemples pratiques

### Configuration de jeu simple

```typescript
const gameControls = {
    // Mouvement (WASD + flèches + stick + D-pad)
    up: { 
        bind: ['w', Input.Up, GamepadInput.LeftStickUp, GamepadInput.Button12], 
        repeat: true 
    },
    down: { 
        bind: ['s', Input.Down, GamepadInput.LeftStickDown, GamepadInput.Button13], 
        repeat: true 
    },
    left: { 
        bind: ['a', Input.Left, GamepadInput.LeftStickLeft, GamepadInput.Button14], 
        repeat: true 
    },
    right: { 
        bind: ['d', Input.Right, GamepadInput.LeftStickRight, GamepadInput.Button15], 
        repeat: true 
    },
    
    // Actions
    jump: { bind: [Input.Space, GamepadInput.Button0] },
    attack: { bind: ['x', GamepadInput.Button2] },
    defend: { bind: ['c', GamepadInput.Button1] },
    menu: { bind: [Input.Escape, GamepadInput.Button9] }
}
```

### Configuration avancée avec caméra

```typescript
const advancedControls = {
    // Mouvement joueur (stick gauche)
    moveUp: { bind: [GamepadInput.LeftStickUp, 'w'], repeat: true },
    moveDown: { bind: [GamepadInput.LeftStickDown, 's'], repeat: true },
    moveLeft: { bind: [GamepadInput.LeftStickLeft, 'a'], repeat: true },
    moveRight: { bind: [GamepadInput.LeftStickRight, 'd'], repeat: true },
    
    // Caméra (stick droit)
    lookUp: { 
        bind: [GamepadInput.RightStickUp], 
        repeat: true,
        method() { /* rotation caméra */ }
    },
    lookDown: { 
        bind: [GamepadInput.RightStickDown], 
        repeat: true,
        method() { /* rotation caméra */ }
    },
    
    // Actions contextuelles
    primaryFire: { bind: [GamepadInput.Button7, 'click'] }, // RT + clic souris
    secondaryFire: { bind: [GamepadInput.Button6, 'rightclick'] }, // LT + clic droit
    reload: { bind: [GamepadInput.Button3, 'r'] }, // Y + R
    sprint: { bind: [GamepadInput.Button10, Input.Shift], repeat: true } // L3 + Shift
}
```

## 🔧 API de la directive

### Propriétés

```typescript
// Vérifier si gamepad connecté
const isConnected = controls.gamepadConnected

// Récupérer la configuration
const currentControls = controls.options
```

### Méthodes

```typescript
// Déclencher une action par code
await controls.applyControl('action', true)  // keydown
await controls.applyControl('action', false) // keyup
await controls.applyControl('action')        // press complet

// Gestion des entrées
controls.stopInputs()   // Arrêter l'écoute
controls.listenInputs() // Reprendre l'écoute

// Récupérer infos contrôle
const actionInfo = controls.getControl('action')
const allControls = controls.getControls()
```

## 🎯 Utilisation en JavaScript

```javascript
// Accès à l'instance de contrôles
const controlsElement = document.querySelector('[data-controls]')
const controls = controlsElement.__controls

// Vérifier status gamepad
if (controls.gamepadConnected) {
    console.log('Gamepad prêt!')
}

// Déclencher action
controls.applyControl('jump')
```

## 🔧 Configuration détaillée

### Options gamepad complètes

```typescript
const gamepadOptions = {
    connect: {
        message: 'Manette détectée !',
        time: 3000,
        icon: '/path/to/gamepad-icon.svg',
        sound: 'gamepad-connect'
    },
    disconnect: {
        message: 'Manette déconnectée',
        time: 2000,
        icon: '/path/to/disconnect-icon.svg',
        sound: 'gamepad-disconnect'
    }
}
```

### Contrôles avec délais

```typescript
const controlsWithDelay = {
    fireball: {
        bind: [GamepadInput.Button0, Input.Space],
        delay: 500, // 500ms entre chaque activation
    },
    
    groupedDelay: {
        bind: [GamepadInput.Button1],
        delay: {
            duration: 300,
            otherControls: ['attack', 'defend'] // Délai partagé
        }
    }
}
```

## 🐛 Dépannage

### Gamepad non détecté

1. **Connecter la manette** (USB ou Bluetooth)
2. **Appuyer sur un bouton** après connexion
3. **Vérifier la console** pour les messages
4. **Tester sur** https://html5gamepad.com/

### Boutons incorrects

1. **Consulter la console** pour voir les codes détectés
2. **Adapter le mapping** selon votre manette
3. **Utiliser les outils dev** du navigateur

### Événements dupliqués

Si clavier et gamepad déclenchent la même action, c'est normal - ils partagent les mêmes bindings. Pour éviter cela :

```typescript
// Séparer les actions si nécessaire
const separateControls = {
    keyboardJump: { bind: [Input.Space] },
    gamepadJump: { bind: [GamepadInput.Button0] },
    
    // Ou utiliser une seule action unifiée (recommandé)
    jump: { bind: [Input.Space, GamepadInput.Button0] }
}
```

## 🌟 Bonnes pratiques

1. **Toujours fournir des alternatives clavier** pour l'accessibilité
2. **Tester avec différentes manettes** (Xbox, PlayStation, génériques)
3. **Utiliser les sticks pour le mouvement** et D-pad pour la navigation menu
4. **Grouper les actions logiques** (saut = espace + bouton A)
5. **Configurer les notifications** pour informer l'utilisateur

## 🔗 Support

- **joypad.js** : https://github.com/ArunMichaelDsouza/joypad.js
- **Gamepad API MDN** : https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API
- **Compatibilité navigateur** : Chrome 25+, Firefox 29+, Safari 10.1+

La directive controls offre maintenant une expérience unifiée pour tous types d'entrées ! 🎮⌨️