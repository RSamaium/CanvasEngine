/**
 * Exemple d'utilisation de la directive controls avec support gamepad intégré
 * 
 * La directive controls gère maintenant à la fois clavier et gamepad dans une seule directive.
 */

import { Input, GamepadInput } from './KeyboardControls'

// Configuration des contrôles - clavier et gamepad dans la même configuration
const controlsConfiguration = {
    // Directions - accepte les inputs clavier ET gamepad
    up: {
        bind: [
            Input.Up, 'w',                          // Clavier: flèche haut et W
            GamepadInput.Button12,                   // Gamepad: D-pad haut
            GamepadInput.LeftStickUp                 // Gamepad: stick gauche haut
        ],
        repeat: true
    },
    down: {
        bind: [
            Input.Down, 's',                         // Clavier: flèche bas et S
            GamepadInput.Button13,                   // Gamepad: D-pad bas
            GamepadInput.LeftStickDown               // Gamepad: stick gauche bas
        ],
        repeat: true
    },
    left: {
        bind: [
            Input.Left, 'a',                         // Clavier: flèche gauche et A
            GamepadInput.Button14,                   // Gamepad: D-pad gauche
            GamepadInput.LeftStickLeft               // Gamepad: stick gauche gauche
        ],
        repeat: true
    },
    right: {
        bind: [
            Input.Right, 'd',                        // Clavier: flèche droite et D
            GamepadInput.Button15,                   // Gamepad: D-pad droite
            GamepadInput.LeftStickRight              // Gamepad: stick gauche droite
        ],
        repeat: true
    },
    
    // Actions principales
    action: {
        bind: [
            Input.Space, Input.Enter,                // Clavier: espace et entrée
            GamepadInput.Button0                     // Gamepad: bouton A (Xbox) / X (PlayStation)
        ]
    },
    back: {
        bind: [
            Input.Escape,                           // Clavier: échap
            GamepadInput.Button1,                   // Gamepad: bouton B (Xbox) / Circle (PlayStation)
            GamepadInput.Button8                    // Gamepad: bouton Select/Share
        ]
    },
    
    // Actions spéciales
    jump: {
        bind: [
            Input.Space,                            // Clavier: espace
            GamepadInput.Button0                    // Gamepad: bouton A/X
        ],
        method({ actionName }) {
            console.log('Saut déclenché !', actionName)
        }
    },
    
    attack: {
        bind: [
            'x',                                    // Clavier: X
            GamepadInput.Button2                    // Gamepad: bouton X (Xbox) / Square (PlayStation)
        ],
        method({ actionName }) {
            console.log('Attaque !', actionName)
        }
    },
    
    menu: {
        bind: [
            Input.Escape,                           // Clavier: échap
            GamepadInput.Button9                    // Gamepad: bouton Start/Options
        ],
        method({ actionName }) {
            console.log('Menu ouvert !', actionName)
        }
    }
}

// Options gamepad (bas niveau)
const gamepadOptions = {
    onConnect: (gamepad) => {
        console.log('Manette connectée:', gamepad.id)
        // Votre logique de connexion ici
    },
    onDisconnect: (gamepad) => {
        console.log('Manette déconnectée:', gamepad.id)
        // Votre logique de déconnexion ici
    }
}

// Exemple d'utilisation dans un template
/*
<!-- HTML/JSX -->
<div 
    data-controls="true"
    :controls="controlsConfiguration"
    :gamepad-options="gamepadOptions"
>
    <!-- Votre contenu de jeu -->
</div>
*/

// Mappings pré-définis pour différentes manettes
export const GamepadMappings = {
    // Configuration Xbox (recommandée)
    xbox: {
        // Boutons face
        A: GamepadInput.Button0,
        B: GamepadInput.Button1,
        X: GamepadInput.Button2,
        Y: GamepadInput.Button3,
        
        // Gâchettes et bumpers
        LB: GamepadInput.Button4,
        RB: GamepadInput.Button5,
        LT: GamepadInput.Button6,
        RT: GamepadInput.Button7,
        
        // Boutons système
        Back: GamepadInput.Button8,
        Start: GamepadInput.Button9,
        
        // Sticks (clic)
        LeftStick: GamepadInput.Button10,
        RightStick: GamepadInput.Button11,
        
        // D-pad
        DPadUp: GamepadInput.Button12,
        DPadDown: GamepadInput.Button13,
        DPadLeft: GamepadInput.Button14,
        DPadRight: GamepadInput.Button15,
        
        // Sticks analogiques
        LeftStickUp: GamepadInput.LeftStickUp,
        LeftStickDown: GamepadInput.LeftStickDown,
        LeftStickLeft: GamepadInput.LeftStickLeft,
        LeftStickRight: GamepadInput.LeftStickRight,
        RightStickUp: GamepadInput.RightStickUp,
        RightStickDown: GamepadInput.RightStickDown,
        RightStickLeft: GamepadInput.RightStickLeft,
        RightStickRight: GamepadInput.RightStickRight
    },
    
    // Configuration PlayStation (peut varier selon le navigateur)
    playstation: {
        // Boutons face (positions physiques)
        X: GamepadInput.Button0,        // Bas
        Circle: GamepadInput.Button1,   // Droite
        Square: GamepadInput.Button2,   // Gauche
        Triangle: GamepadInput.Button3, // Haut
        
        // Gâchettes et bumpers
        L1: GamepadInput.Button4,
        R1: GamepadInput.Button5,
        L2: GamepadInput.Button6,
        R2: GamepadInput.Button7,
        
        // Boutons système
        Share: GamepadInput.Button8,
        Options: GamepadInput.Button9,
        
        // Sticks (clic)
        L3: GamepadInput.Button10,
        R3: GamepadInput.Button11,
        
        // D-pad
        DPadUp: GamepadInput.Button12,
        DPadDown: GamepadInput.Button13,
        DPadLeft: GamepadInput.Button14,
        DPadRight: GamepadInput.Button15
    }
}

// Exemple d'utilisation avec détection automatique
/*
import { KeyboardControls, Input, GamepadInput } from 'canvasengine'

class GameController {
    private controls: KeyboardControls | null = null
    
    setupControls() {
        // La directive sera automatiquement créée avec l'élément DOM
        // Vous pouvez accéder à l'instance via l'élément
        
        const controlsElement = document.querySelector('[data-controls]')
        if (controlsElement) {
            // L'instance est stockée sur l'élément DOM
            this.controls = (controlsElement as any).__controls
        }
    }
    
    checkGamepadStatus() {
        if (this.controls) {
            return this.controls.gamepadConnected
        }
        return false
    }
    
    simulateAction() {
        // Déclencher une action par code
        if (this.controls) {
            this.controls.applyControl('action')
        }
    }
}
*/

// Configuration avancée avec gestion de caméra
const advancedConfiguration = {
    // Mouvement du joueur (stick gauche + clavier)
    moveUp: {
        bind: [Input.Up, 'w', GamepadInput.LeftStickUp],
        repeat: true
    },
    moveDown: {
        bind: [Input.Down, 's', GamepadInput.LeftStickDown],
        repeat: true
    },
    moveLeft: {
        bind: [Input.Left, 'a', GamepadInput.LeftStickLeft],
        repeat: true
    },
    moveRight: {
        bind: [Input.Right, 'd', GamepadInput.LeftStickRight],
        repeat: true
    },
    
    // Contrôle de caméra (stick droit + souris)
    lookUp: {
        bind: [GamepadInput.RightStickUp],
        repeat: true,
        method({ actionName }) {
            // Logique de rotation de caméra vers le haut
        }
    },
    lookDown: {
        bind: [GamepadInput.RightStickDown],
        repeat: true,
        method({ actionName }) {
            // Logique de rotation de caméra vers le bas
        }
    },
    lookLeft: {
        bind: [GamepadInput.RightStickLeft],
        repeat: true,
        method({ actionName }) {
            // Logique de rotation de caméra vers la gauche
        }
    },
    lookRight: {
        bind: [GamepadInput.RightStickRight],
        repeat: true,
        method({ actionName }) {
            // Logique de rotation de caméra vers la droite
        }
    },
    
    // Actions de jeu
    primaryAction: {
        bind: [Input.Space, GamepadInput.Button0], // Espace / A-X
    },
    secondaryAction: {
        bind: ['x', GamepadInput.Button2], // X / X-Square
    },
    reload: {
        bind: ['r', GamepadInput.Button3], // R / Y-Triangle
    },
    sprint: {
        bind: [Input.Shift, GamepadInput.Button10], // Shift / L3
        repeat: true
    },
    crouch: {
        bind: ['c', GamepadInput.Button11], // C / R3
    }
}

export { controlsConfiguration, gamepadOptions, advancedConfiguration }