import { readFileSync } from 'fs';
import pkg from 'peggy';

const { generate } = pkg;

// Charger la grammaire à partir d'un fichier
const grammar = readFileSync("grammar.pegjs", "utf8");

// Créer un parseur à partir de la grammaire
const parser = generate(grammar);

// Exemple d'entrée à analyser
const input = `<Canvas [width]="x">
    @for (let sprite of sprites) {
        @if (sprite.visible) {
            
        }
    }
</Canvas>`;

// Utiliser le parseur pour analyser l'entrée
try {
    const output = parser.parse(input);
    console.log(output);
} catch (error) {
    console.error("Erreur de parsing:", error);
}
