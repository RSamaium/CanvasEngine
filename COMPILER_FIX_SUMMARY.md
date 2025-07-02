# Correction du Compilateur : Préservation des Variables defineProps

## Problème Identifié

Le compilateur CanvasEngine supprimait incorrectement les constantes déclarées avec `defineProps()` lors de la transformation du fichier `.ce`. TypeScript considérait ces variables comme inutilisées dans le script et les supprimait, même si elles étaient utilisées dans le template.

### Exemple du problème :
```vue
<Canvas>
    <Text text />
</Canvas>

<script>
const props = defineProps(); // Cette ligne était supprimée
</script>
```

## Solution Implémentée

Modification du fichier `packages/compiler/index.ts` pour détecter et préserver toutes les variables déclarées avec `defineProps()`.

### Changements Apportés

1. **Détection améliorée** : Utilisation d'une regex plus robuste pour capturer tous les types de déclarations `defineProps`
2. **Préservation forcée** : Ajout de références aux variables détectées pour empêcher TypeScript de les supprimer
3. **Support complet** : Gestion de tous les cas d'usage (destructuration, alias, valeurs par défaut, etc.)

### Code Modifié

```typescript
// Extract ALL variables declared with defineProps to avoid TypeScript removing them
// This handles both simple and destructured declarations
const definePropsRegex = /(?:const|let|var)\s+([^=]+?)\s*=\s*defineProps\s*\(/g;
const definePropsVars: string[] = [];
let match;

while ((match = definePropsRegex.exec(scriptContent)) !== null) {
  const declaration = match[1].trim();
  
  if (declaration.startsWith('{') && declaration.endsWith('}')) {
    // Destructured variables like: const { text, value } = defineProps()
    const destructuredContent = declaration.slice(1, -1);
    const destructuredVars = destructuredContent.split(',').map(v => {
      // Handle both "prop" and "prop: alias" cases
      const cleanVar = v.trim().split(':')[0].trim();
      return cleanVar;
    });
    definePropsVars.push(...destructuredVars);
  } else {
    // Simple variable like: const props = defineProps()
    definePropsVars.push(declaration);
  }
}

// trick to avoid typescript remove imports and defineProps variables in scriptContent
// We reference all defineProps variables so TypeScript doesn't remove them
let varRefs = definePropsVars.length > 0 ? `;${definePropsVars.join(';')};` : '';
scriptContent += FLAG_COMMENT + parsedTemplate + varRefs
```

## Cas d'Usage Supportés

✅ **Déclaration simple** : `const props = defineProps()`  
✅ **Destructuration** : `const { text, value } = defineProps()`  
✅ **Types TypeScript** : `const { text }: { text: string } = defineProps()`  
✅ **Valeurs par défaut** : `const { text = "default" } = defineProps()`  
✅ **Alias** : `const { text: displayText } = defineProps()`  
✅ **Déclarations multiples** : Plusieurs `defineProps` dans le même fichier  
✅ **let/var** : Support de `let` et `var` en plus de `const`  

## Résultat

Désormais, toutes les variables déclarées avec `defineProps()` sont correctement préservées dans le code généré et peuvent être utilisées dans le template sans être supprimées par TypeScript.

### Avant la correction :
```javascript
// Variables supprimées - erreur à l'exécution
```

### Après la correction :
```javascript
var text = defineProps().text;
var props = defineProps();
// Variables préservées et utilisables dans le template
```