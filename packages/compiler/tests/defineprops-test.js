import fs from 'fs';
import canvasengine from '../dist/index.js';

// Créer un plugin de test
const plugin = canvasengine();

// Test simple avec defineProps destructuré
const testCode1 = `<Canvas>
    <Text text />
</Canvas>

<script>
const { text } = defineProps();
</script>`;

// Test simple avec defineProps variable simple
const testCode2 = `<Canvas>
    <Text text />
</Canvas>

<script>
const props = defineProps();
</script>`;

// Test avec plusieurs variables
const testCode3 = `<Canvas>
    <Text text />
    <Sprite width height />
</Canvas>

<script>
const { text, width, height } = defineProps();
</script>`;

console.log('Test 1 - defineProps destructuré:');
try {
  const result1 = plugin.transform(testCode1, 'test1.ce');
  console.log('✓ Transformation réussie');
  console.log('Code généré:');
  console.log(result1.code);
  console.log('');
} catch (error) {
  console.log('✗ Erreur:', error.message);
}

console.log('Test 2 - defineProps variable simple:');
try {
  const result2 = plugin.transform(testCode2, 'test2.ce');
  console.log('✓ Transformation réussie');
  console.log('Code généré:');
  console.log(result2.code);
  console.log('');
} catch (error) {
  console.log('✗ Erreur:', error.message);
}

console.log('Test 3 - defineProps avec plusieurs variables:');
try {
  const result3 = plugin.transform(testCode3, 'test3.ce');
  console.log('✓ Transformation réussie');
  console.log('Code généré:');
  console.log(result3.code);
  console.log('');
} catch (error) {
  console.log('✗ Erreur:', error.message);
}