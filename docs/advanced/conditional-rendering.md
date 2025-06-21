# Conditional Rendering

The `cond()` function allows you to conditionally render elements based on reactive signals or static boolean values. It supports if/else if/else patterns for complex conditional logic.

## Basic Usage

### Simple Condition

```typescript
import { cond, signal, h, Text } from 'canvasengine';

const isVisible = signal(true);

const conditionalText = cond(
  isVisible,
  () => h(Text, { text: 'I am visible!' })
);
```

### With Else

```typescript
const conditionalText = cond(
  isVisible,
  () => h(Text, { text: 'Visible' }),
  () => h(Text, { text: 'Hidden' }) // else case
);
```

## Advanced Usage

### Multiple Conditions (else if)

```typescript
const status = signal('loading');

const statusDisplay = cond(
  () => status() === 'loading',
  () => h(Text, { text: 'Loading...', color: 'yellow' }),
  [() => status() === 'error', () => h(Text, { text: 'Error!', color: 'red' })], // else if
  [() => status() === 'success', () => h(Text, { text: 'Success!', color: 'green' })], // else if
  () => h(Text, { text: 'Unknown status', color: 'gray' }) // else
);
```

### Grade System Example

```typescript
const score = signal(85);

const gradeDisplay = cond(
  () => score() >= 90,
  () => h(Text, { text: 'A+', color: 'gold' }),
  [() => score() >= 80, () => h(Text, { text: 'A', color: 'green' })],
  [() => score() >= 70, () => h(Text, { text: 'B', color: 'blue' })],
  [() => score() >= 60, () => h(Text, { text: 'C', color: 'orange' })],
  () => h(Text, { text: 'F', color: 'red' }) // else
);
```

## Condition Types

The `cond()` function accepts three types of conditions:

1. **Signals**: Reactive values that trigger re-evaluation when changed
2. **Static booleans**: Simple true/false values
3. **Functions**: Functions that return boolean values (automatically converted to computed signals)

### Examples

```typescript
// Signal condition
const showElement = signal(true);
cond(showElement, () => h(Text, { text: 'Signal condition' }));

// Static boolean condition
cond(true, () => h(Text, { text: 'Static condition' }));

// Function condition (reactive)
const user = signal({ role: 'admin' });
cond(
  () => user().role === 'admin',
  () => h(Text, { text: 'Admin panel' })
);
```

## Reactivity

All conditions are reactive. When any signal used in the conditions changes, the `cond()` function automatically re-evaluates and updates the rendered element:

```typescript
const userRole = signal('guest');

const navigation = cond(
  () => userRole() === 'admin',
  () => h(Container, { children: [
    h(Text, { text: 'Admin Dashboard' }),
    h(Text, { text: 'User Management' }),
    h(Text, { text: 'Settings' })
  ]}),
  [() => userRole() === 'user', () => h(Container, { children: [
    h(Text, { text: 'Dashboard' }),
    h(Text, { text: 'Profile' })
  ]})],
  () => h(Text, { text: 'Please log in' }) // guest
);

// Changing the role will automatically update the UI
userRole.set('admin'); // Shows admin navigation
userRole.set('user');  // Shows user navigation
userRole.set('guest'); // Shows login message
```

## Performance

- **Lazy evaluation**: Only the matching condition's element is created
- **Automatic cleanup**: Previous elements are properly destroyed when conditions change
- **Optimized updates**: Elements are only updated when the matching condition actually changes

## Best Practices

1. **Order matters**: Conditions are evaluated in order, the first `true` condition wins
2. **Use functions for complex logic**: Convert complex boolean expressions to functions for better reactivity
3. **Provide fallbacks**: Always consider adding an `else` case for unexpected states
4. **Keep conditions simple**: Complex logic should be extracted to computed signals or functions

```typescript
// Good: Simple, readable conditions
const theme = signal('dark');
cond(
  () => theme() === 'dark',
  () => h(Text, { text: 'Dark mode', color: 'white' }),
  () => h(Text, { text: 'Light mode', color: 'black' })
);

// Better: Extract complex logic
const isDarkMode = computed(() => {
  const currentTheme = theme();
  const userPreference = getUserPreference();
  const systemPreference = getSystemPreference();
  
  return currentTheme === 'dark' || 
         (currentTheme === 'auto' && (userPreference === 'dark' || systemPreference === 'dark'));
});

cond(
  isDarkMode,
  () => h(Text, { text: 'Dark mode', color: 'white' }),
  () => h(Text, { text: 'Light mode', color: 'black' })
);
``` 