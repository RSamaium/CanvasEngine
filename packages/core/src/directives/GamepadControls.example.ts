/**
 * Exemple d'utilisation de la directive gamepadControls
 * 
 * Cette directive permet d'utiliser une manette de jeu avec les mêmes bindings
 * que les contrôles clavier existants.
 */

import { GamepadInput } from './GamepadControls'

// Exemple de configuration de base
const gamepadConfiguration = {
    // Directions - utilise les mêmes noms que KeyboardControls
    up: {
        bind: [GamepadInput.Button12, GamepadInput.LeftStickUp], // D-pad up + stick gauche haut
        repeat: true
    },
    down: {
        bind: [GamepadInput.Button13, GamepadInput.LeftStickDown], // D-pad down + stick gauche bas
        repeat: true
    },
    left: {
        bind: [GamepadInput.Button14, GamepadInput.LeftStickLeft], // D-pad left + stick gauche gauche
        repeat: true
    },
    right: {
        bind: [GamepadInput.Button15, GamepadInput.LeftStickRight], // D-pad right + stick gauche droite
        repeat: true
    },
    
    // Actions principales
    action: {
        bind: [GamepadInput.Button0, GamepadInput.Button1], // Boutons A et B (Xbox: A et B, PS: X et Circle)
    },
    back: {
        bind: [GamepadInput.Button9, GamepadInput.Button8], // Start et Select/Back
    },
    
    // Actions personnalisées
    jump: {
        bind: GamepadInput.Button0, // Bouton A (Xbox) / X (PlayStation)
        method({ actionName }) {
            console.log('Saut avec la manette!', actionName)
        }
    },
    
    menu: {
        bind: GamepadInput.Button9, // Start
        method({ actionName }) {
            console.log('Menu ouvert avec la manette!', actionName)
        }
    }
}

// Exemple d'options de notification
const gamepadOptions = {
    connect: {
        message: 'Manette connectée !',
        time: 3000,
        sound: 'connect'
    },
    disconnect: {
        message: 'Manette déconnectée !',
        time: 3000,
        sound: 'disconnect'
    }
}

// Exemple d'utilisation dans un composant
/*
<!-- Dans votre template HTML/JSX -->
<div 
    data-controls="true"
    data-gamepad-controls="true"
    :controls="keyboardConfiguration"
    :gamepad-controls="gamepadConfiguration"
    :gamepad-options="gamepadOptions"
>
    <!-- Votre contenu de jeu -->
</div>
*/

// Exemple complet avec les deux directives
const exampleFullConfiguration = {
    // Configuration clavier et manette partagée
    controls: {
        // Directions
        up: {
            bind: ['up', 'w'], // Clavier: flèche haut ou W
            repeat: true
        },
        down: {
            bind: ['down', 's'], // Clavier: flèche bas ou S
            repeat: true
        },
        left: {
            bind: ['left', 'a'], // Clavier: flèche gauche ou A
            repeat: true
        },
        right: {
            bind: ['right', 'd'], // Clavier: flèche droite ou D
            repeat: true
        },
        
        // Actions
        action: {
            bind: ['space', 'enter'], // Clavier: espace ou entrée
        },
        back: {
            bind: 'escape', // Clavier: échap
        }
    },
    
    // Configuration manette - utilise les mêmes noms de contrôles
    gamepadControls: {
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
        action: {
            bind: GamepadInput.Button0, // Bouton A/X
        },
        back: {
            bind: GamepadInput.Button1, // Bouton B/Circle
        }
    },
    
    gamepadOptions: {
        connect: {
            message: 'Manette prête !',
            time: 2000
        },
        disconnect: {
            message: 'Manette déconnectée',
            time: 2000
        }
    }
}

// Mapping des boutons standards pour différentes manettes
export const GamepadMappings = {
    // Mapping Xbox One/Series
    xbox: {
        action: GamepadInput.Button0,    // A
        back: GamepadInput.Button1,      // B
        secondary: GamepadInput.Button2, // X
        special: GamepadInput.Button3,   // Y
        leftBumper: GamepadInput.Button4,
        rightBumper: GamepadInput.Button5,
        leftTrigger: GamepadInput.Button6,
        rightTrigger: GamepadInput.Button7,
        select: GamepadInput.Button8,
        start: GamepadInput.Button9,
        leftStick: GamepadInput.Button10,
        rightStick: GamepadInput.Button11,
        dpadUp: GamepadInput.Button12,
        dpadDown: GamepadInput.Button13,
        dpadLeft: GamepadInput.Button14,
        dpadRight: GamepadInput.Button15
    },
    
    // Mapping PlayStation (approximatif, peut varier selon le navigateur)
    playstation: {
        action: GamepadInput.Button0,    // X (en bas)
        back: GamepadInput.Button1,      // Circle (à droite)
        secondary: GamepadInput.Button2, // Square (à gauche)
        special: GamepadInput.Button3,   // Triangle (en haut)
        leftBumper: GamepadInput.Button4,  // L1
        rightBumper: GamepadInput.Button5, // R1
        leftTrigger: GamepadInput.Button6, // L2
        rightTrigger: GamepadInput.Button7, // R2
        select: GamepadInput.Button8,      // Share
        start: GamepadInput.Button9,       // Options
        leftStick: GamepadInput.Button10,  // L3
        rightStick: GamepadInput.Button11, // R3
        dpadUp: GamepadInput.Button12,
        dpadDown: GamepadInput.Button13,
        dpadLeft: GamepadInput.Button14,
        dpadRight: GamepadInput.Button15
    }
}

// Exemple d'utilisation avec détection automatique de manette
/*
import { GamepadControls, GamepadInput } from 'canvasengine'

// Dans votre composant ou classe de jeu
class GameController {
    private gamepadControls: GamepadControls | null = null
    
    setupControls() {
        // La directive sera automatiquement créée quand l'élément avec
        // data-gamepad-controls sera monté dans le DOM
        
        // Vous pouvez écouter l'état de connexion via les callbacks
        // définis dans gamepadOptions
    }
    
    checkGamepadStatus() {
        // Si vous avez une référence à l'instance GamepadControls
        if (this.gamepadControls) {
            return this.gamepadControls.connected
        }
        return false
    }
}
*/