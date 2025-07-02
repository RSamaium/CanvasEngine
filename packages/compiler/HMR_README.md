# Hot Module Replacement (HMR) pour les composants CanvasEngine `.ce`

Le compilateur CanvasEngine inclut maintenant le support complet du Hot Module Replacement (HMR) pour les fichiers `.ce`. Cela permet de mettre à jour vos composants en temps réel sans rechargement de la page.

## 🔥 Fonctionnalités

- ✅ **Rechargement automatique** des composants `.ce` lors de modifications
- ✅ **Préservation de l'état** : L'état de l'application est conservé lors des mises à jour
- ✅ **Gestion d'erreurs** : Affichage d'erreurs claires en cas de problème de compilation
- ✅ **Support PixiJS** : Mise à jour intelligente des objets d'affichage PixiJS
- ✅ **Logging détaillé** : Messages de debug dans la console pour suivre les mises à jour

## 🚀 Comment ça marche

### Détection automatique
Le système HMR est **automatiquement activé** en mode développement quand vous utilisez Vite. Aucune configuration supplémentaire n'est requise.

### Exemple d'utilisation

1. **Lancez le serveur de développement** :
   ```bash
   npm run dev
   # ou dans le sample
   cd sample && npm run dev
   ```

2. **Modifiez un fichier `.ce`** :
   ```vue
   <Canvas>
     <Container>
       <Sprite x={100} y={100} />  <!-- Changez ces valeurs -->
     </Container>
   </Canvas>

   <script>
     import { signal } from "canvasengine";
     
     const x = signal(200); // Modifiez cette valeur
     // Le composant se mettra à jour automatiquement !
   </script>
   ```

3. **Observez la mise à jour** :
   - Le composant se met à jour instantanément
   - Aucun rechargement de page
   - L'état des autres composants est préservé

## 🛠️ Configuration avancée

### Vite Configuration
Le plugin est déjà configuré dans `vite.config.ts` :

```typescript
import { defineConfig } from 'vite'
import canvasengine from '@canvasengine/compiler'

export default defineConfig({
  plugins: [canvasengine()], // HMR inclus automatiquement
})
```

### Variables d'environnement
Le HMR est activé quand :
- `NODE_ENV === "development"`
- `NODE_ENV === "dev"`
- Ou lors de l'utilisation de `vite dev`

## 🔧 API Avancée

### Utilitaires HMR
Le compilateur exporte des utilitaires pour un contrôle avancé :

```typescript
import { canvasEngineHMR, registerComponentForHMR } from '@canvasengine/compiler'

// Obtenir des statistiques HMR
const stats = canvasEngineHMR.getStats()
console.log(`${stats.componentCount} composants trackés`)

// Écouter les mises à jour HMR
window.addEventListener('canvasengine:hmr-update', (event) => {
  console.log('Mise à jour HMR:', event.detail)
})
```

### Callbacks personnalisés
Vous pouvez ajouter des callbacks personnalisés dans vos composants :

```vue
<script>
  // Callback appelé lors d'une mise à jour HMR
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      console.log('Composant mis à jour!')
      // Votre logique personnalisée ici
    })
  }
</script>
```

## 🐛 Debug et Résolution de problèmes

### Messages de la console
Le système HMR affiche des messages détaillés :
```
[CanvasEngine HMR] Client initialized
[CanvasEngine HMR] Registered component instance: YXBwLmNl
[HMR] Updated CanvasEngine component: YXBwLmNl
[CanvasEngine HMR] Successfully updated 1 instance(s) of component: YXBwLmNl
```

### Problèmes courants

**1. Le HMR ne fonctionne pas**
- Vérifiez que vous êtes en mode développement
- Assurez-vous que Vite est lancé avec `vite dev` ou `npm run dev`

**2. Erreurs de compilation**
- Les erreurs de syntaxe dans les fichiers `.ce` sont affichées clairement
- Corrigez les erreurs et le HMR reprendra automatiquement

**3. État perdu lors des mises à jour**
- Le HMR préserve l'état des `signal()` et variables réactives
- Si l'état est perdu, vérifiez la structure de votre composant

## 📈 Performance

Le système HMR est optimisé pour :
- **Mises à jour rapides** : < 50ms pour la plupart des composants
- **Faible impact mémoire** : Nettoyage automatique des instances obsolètes
- **Gestion de file d'attente** : Les mises à jour multiples sont batchées

## 🔄 Stratégies de mise à jour

Le système utilise plusieurs stratégies pour mettre à jour les composants :

1. **Méthode `update()`** : Si le composant a une méthode update
2. **Force update parent** : Si le parent peut forcer une mise à jour
3. **Mise à jour PixiJS** : Pour les objets d'affichage PixiJS natifs
4. **Fallback** : Tentative de mise à jour générique

## 🎯 Bonnes pratiques

### ✅ Recommandé
- Utilisez des `signal()` pour l'état réactif
- Gardez la logique métier dans la partie `<script>`
- Séparez les composants complexes en plus petits composants

### ❌ À éviter
- Ne pas modifier la structure du template trop radicalement
- Éviter les side effects dans le rendu
- Ne pas utiliser des références directes aux objets PixiJS

## 🚦 Statut et Compatibilité

- ✅ **Vite 5+** : Support complet
- ✅ **TypeScript** : Types inclus
- ✅ **PixiJS 8+** : Intégration native
- ✅ **Mode développement** : Activé automatiquement
- ❌ **Mode production** : Désactivé (pour les performances)

---

## 📚 Exemples complets

Consultez le dossier `sample/` pour des exemples concrets d'utilisation du HMR avec différents types de composants CanvasEngine.

## 🤝 Contribution

Si vous rencontrez des problèmes ou avez des suggestions d'amélioration, ouvrez une issue sur le repository GitHub.