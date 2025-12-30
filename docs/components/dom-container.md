# DOMContainer Component

The `DOMContainer` component provides a bridge between the canvas rendering system and traditional DOM manipulation. It allows you to render standard DOM elements within your canvas application while maintaining proper transform hierarchy and visibility.

This component is especially useful for rendering form elements like `<input>`, `<textarea>`, or `<select>` that handle user input, as this is often simpler and more flexible than implementing text input directly in PixiJS.

## Basic Usage

```html
<DOMContainer x={100} y={50}>
  <input type="text" placeholder="Enter text..." />
</DOMContainer>
```

## Form Elements with Reactive Signals

For form elements (`input`, `textarea`, `select`), the component supports reactive two-way data binding using signals:

```html
<script>
import { signal } from 'canvasengine'

const inputValue = signal('initial value')
</script>

<DOMContainer>
  <input type="text" value={inputValue} />
</DOMContainer>
```

The component automatically:
- Sets the initial value from the signal
- Listens for `input` events and updates the signal with the new value
- Updates the DOM element when the signal value changes programmatically

## Form Submission with Automatic Data Collection

When a `form` element has a `submit` event handler, the component automatically:
- Prevents the default form submission behavior (stops propagation)
- Collects all form data from input elements within the form
- Passes both the event and the collected form data as parameters to the submit handler
- Handles multiple values for the same field name (e.g., checkboxes with same name)

```html
<script>
const handleSubmit = (event, formData) => {
  console.log('Form submitted with data:', formData)
  // Example formData: { username: 'john', password: 'secret', remember: 'on' }
}
</script>

<DOMContainer>
  <form submit={handleSubmit}>
    <input name="username" type="text" placeholder="Username" />
    <input name="password" type="password" placeholder="Password" />
    <input name="remember" type="checkbox" value="on" />
    <button type="submit">Login</button>
  </form>
</DOMContainer>
```

## Styling DOM Elements

### CSS Classes

You can apply CSS classes using different formats:

```html
<!-- String format: space-separated classes -->
<DOMContainer>
  <div class="container primary-theme">Content</div>
</DOMContainer>

<!-- You can also declare multiple class attributes; they are merged -->
<DOMContainer>
  <div class="container" class={['primary-theme', { active: isActive } ]}>Content</div>
</DOMContainer>

<!-- Array format: array of class names -->
<DOMContainer>
  <div class={['container', 'primary-theme', 'active']}>Content</div>
</DOMContainer>

<!-- Mixed array format: combine static and reactive classes -->
<DOMContainer>
  <div class={['container', { active: isActive } ]}>Content</div>
</DOMContainer>

<!-- Object format: conditional classes -->
<script>
const isActive = signal(false)
const theme = signal('light')
</script>

<DOMContainer>
  <div class={{
    'container': true,
    'active': isActive(),
    'theme-light': theme() === 'light',
    'theme-dark': theme() === 'dark'
  }}>Content</div>
</DOMContainer>
```

### Inline Styles

You can apply styles using different formats:

```html
<!-- String format: CSS style string -->
<DOMContainer>
  <div style="background-color: red; padding: 10px;">Content</div>
</DOMContainer>

<!-- Object format: style properties -->
<DOMContainer>
  <div style={{
    backgroundColor: 'blue',
    padding: '20px',
    fontSize: '16px'
  }}>Content</div>
</DOMContainer>
```

## Event Handling

You can attach event handlers to DOM elements:

```html
<script>
const handleClick = (event) => {
  console.log('Button clicked!', event)
}

const handleFocus = (event) => {
  console.log('Input focused!', event)
}
</script>

<DOMContainer>
  <button click={handleClick}>Click me</button>
  <input type="text" focus={handleFocus} placeholder="Focus me" />
</DOMContainer>
```

## Nested DOM Elements

You can create complex DOM structures with nested elements:

```html
<DOMContainer>
  <div class="outer-container">
    <div class="inner-container">
      <h2>Nested Content</h2>
      <p>This is nested inside multiple divs</p>
    </div>
  </div>
</DOMContainer>
```

## Complete Form Example

Here's a comprehensive example showing a login form with reactive inputs:

```html
<script>
import { signal } from 'canvasengine'

const username = signal('')
const password = signal('')
const rememberMe = signal(false)

const handleSubmit = (event, formData) => {
  console.log('Login attempt:', formData)
  // Handle login logic here
}

const handleReset = () => {
  username.set('')
  password.set('')
  rememberMe.set(false)
}
</script>

<DOMContainer x={100} y={100}>
  <form submit={handleSubmit} class="login-form">
    <div class="form-group">
      <label for="username">Username:</label>
      <input 
        id="username"
        name="username" 
        type="text" 
        placeholder="Enter username"
        value={username}
        required
      />
    </div>
    
    <div class="form-group">
      <label for="password">Password:</label>
      <input 
        id="password"
        name="password" 
        type="password" 
        placeholder="Enter password"
        value={password}
        required
      />
    </div>
    
    <div class="form-group">
      <label>
        <input 
          name="remember" 
          type="checkbox" 
          checked={rememberMe()}
        />
        Remember me
      </label>
    </div>
    
    <div class="form-actions">
      <button type="submit">Login</button>
      <button type="button" click={handleReset}>Reset</button>
    </div>
  </form>
</DOMContainer>
```

## Supported HTML Elements

The DOMContainer supports all standard HTML elements, including:

- **Form elements**: `input`, `textarea`, `select`, `button`, `form`
- **Text elements**: `p`, `span`, `div`, `h1`-`h6`, `label`
- **List elements**: `ul`, `ol`, `li`
- **Media elements**: `img`, `video`, `audio`
- **Interactive elements**: `a`, `button`
- **Semantic elements**: `section`, `article`, `header`, `footer`, `nav`

## Supported Events

The component supports all standard DOM events:

- **Mouse events**: `click`, `mouseover`, `mouseout`, `mouseenter`, `mouseleave`, `mousemove`, `mouseup`, `mousedown`
- **Touch events**: `touchstart`, `touchend`, `touchmove`, `touchcancel`
- **Keyboard events**: `keydown`, `keyup`, `keypress`
- **Form events**: `submit`, `reset`, `change`, `input`, `focus`, `blur`
- **Drag events**: `drag`, `dragend`, `dragenter`, `dragleave`, `dragover`, `drop`, `dragstart`
- **Other events**: `wheel`, `scroll`, `resize`, `contextmenu`, `select`
