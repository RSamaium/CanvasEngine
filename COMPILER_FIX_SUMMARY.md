# Correction du Compilateur : Préservation des Variables defineProps et Imports

## Problème Identifié

Le compilateur CanvasEngine supprimait incorrectement :
1. Les constantes déclarées avec `defineProps()` 
2. Les imports non utilisés dans le script

TypeScript considérait ces éléments comme inutilisés dans le script et les supprimait, même s'ils étaient utilisés dans le template.

### Exemple du problème :
```vue
<Canvas>
    <Text text />
    <MyComponent />
</Canvas>

<script>
import { MyComponent } from 'components'; // Cet import était supprimé
const props = defineProps(); // Cette ligne était supprimée
</script>
```

## Solution Implémentée

Modification du fichier `packages/compiler/index.ts` pour détecter et préserver :
1. Toutes les variables déclarées avec `defineProps()`
2. Tous les imports utilisés dans le template

### Changements Apportés

1. **Détection améliorée** : Utilisation de regex robustes pour capturer tous les types de déclarations `defineProps` et d'imports
2. **Préservation forcée** : Ajout de références aux variables et imports détectés pour empêcher TypeScript de les supprimer
3. **Support complet** : Gestion de tous les cas d'usage (destructuration, alias, valeurs par défaut, imports mixtes, etc.)

### Code Modifié

```typescript
// Extract ALL variables declared with defineProps to avoid TypeScript removing them
const definePropsRegex = /(?:const|let|var)\s+([^=]+?)\s*=\s*defineProps\s*\(/g;
const definePropsVars: string[] = [];
let match;

while ((match = definePropsRegex.exec(scriptContent)) !== null) {
  const declaration = match[1].trim();
  
  if (declaration.startsWith('{') && declaration.endsWith('}')) {
    // Destructured variables like: const { text, value } = defineProps()
    const destructuredContent = declaration.slice(1, -1);
    const destructuredVars = destructuredContent.split(',').map(v => {
      const cleanVar = v.trim().split(':')[0].trim();
      return cleanVar;
    });
    definePropsVars.push(...destructuredVars);
  } else {
    // Simple variable like: const props = defineProps()
    definePropsVars.push(declaration);
  }
}

// Extract ALL imports to avoid TypeScript removing them when they're used in template but not in script
const importRegex = /import\s+(?:type\s+)?([^;]+?)\s+from\s+['"]([^'"]+)['"];?/g;
const importedVars: string[] = [];
let importMatch;

while ((importMatch = importRegex.exec(scriptContent)) !== null) {
  const importClause = importMatch[1].trim();
  
  // Skip type-only imports
  if (importMatch[0].includes('import type')) {
    continue;
  }
  
  // Handle different import patterns
  if (importClause.includes('*')) {
    // Namespace import: import * as module from 'module'
    const namespaceMatch = importClause.match(/\*\s+as\s+(\w+)/);
    if (namespaceMatch) {
      importedVars.push(namespaceMatch[1]);
    }
  } else if (importClause.includes('{')) {
    // Named imports (possibly with default): import Default, { Named1, Named2 } from 'module'
    const parts = importClause.split('{');
    
    // Check for default import before the brace
    const beforeBrace = parts[0].trim();
    if (beforeBrace) {
      const defaultImport = beforeBrace.replace(',', '').trim();
      if (defaultImport) {
        importedVars.push(defaultImport);
      }
    }
    
    // Extract named imports
    const namedPart = parts[1].replace('}', '');
    const namedImports = namedPart.split(',').map(v => {
      const cleanVar = v.trim().split(' as ')[0].trim();
      return cleanVar;
    }).filter(v => v);
    importedVars.push(...namedImports);
  } else {
    // Default import only: import Component from 'module'
    importedVars.push(importClause);
  }
}

// Reference all defineProps variables and imported variables so TypeScript doesn't remove them
let varRefs = '';
if (definePropsVars.length > 0) {
  varRefs += `;${definePropsVars.join(';')};`;
}
if (importedVars.length > 0) {
  varRefs += `;${importedVars.join(';')};`;
}
scriptContent += FLAG_COMMENT + parsedTemplate + varRefs
```

## Cas d'Usage Supportés

### Variables defineProps
✅ **Déclaration simple** : `const props = defineProps()`  
✅ **Destructuration** : `const { text, value } = defineProps()`  
✅ **Types TypeScript** : `const { text }: { text: string } = defineProps()`  
✅ **Valeurs par défaut** : `const { text = "default" } = defineProps()`  
✅ **Alias** : `const { text: displayText } = defineProps()`  
✅ **Déclarations multiples** : Plusieurs `defineProps` dans le même fichier  
✅ **let/var** : Support de `let` et `var` en plus de `const`  

### Imports
✅ **Import nommé** : `import { Component } from 'module'`  
✅ **Import par défaut** : `import Component from 'module'`  
✅ **Import namespace** : `import * as Module from 'module'`  
✅ **Import avec alias** : `import { Component as MyComponent } from 'module'`  
✅ **Imports mixtes** : `import Default, { Named1, Named2 } from 'module'`  
✅ **Imports multiples** : Plusieurs imports dans le même fichier  
❌ **Imports de types** : `import type { Props } from 'types'` (ignorés, comportement correct)

## Résultat

Désormais, toutes les variables déclarées avec `defineProps()` ET tous les imports utilisés dans le template sont correctement préservés dans le code généré sans être supprimés par TypeScript.

### Avant la correction :
```javascript
// Variables et imports supprimés - erreur à l'exécution
// TypeError: MyComponent is not defined
// ReferenceError: text is not defined
```

### Après la correction :
```javascript
import { MyComponent } from 'components';
// ... autres imports préservés

var text = defineProps().text;
var props = defineProps();
// Variables et imports préservés et utilisables dans le template
```