# Trigger

Trigger is a type of signal that can be used to pass data to a component. They are created using the `trigger` function. For example:

```html
<script>
  import { trigger, on } from 'canvasengine';

  const myTrigger = trigger()

  on(myTrigger, () => {
    console.log('Click')
  })

  const run = () => {
    myTrigger.start()
  }
</script>

<Rect x="0" y="0" width="10" height="10" color="red" @click={run} />
```


::: tip native events

if you're using native events (such as click, it takes care of the trigger automatically)

```html
<script>
  import { trigger, on } from 'canvasengine';

  const click = trigger()

  on(click, () => {
    console.log('Click')
  })
</script>

<Rect x="0" y="0" width="10" height="10" color="red" @click />
```
:::

## With data

```html
<script>
  import { trigger, on } from 'canvasengine';

  const myTrigger = trigger()

  on(myTrigger, (data) => {
    console.log(data)
  })

  const run = () => {
    myTrigger.start({
      message: 'Hello World'
    })
  }
</script>

<Rect x="0" y="0" width="10" height="10" color="red" @click={run} />
```

::: tip

you can set global data that will be merged with the start method

```html
<script>
  import { trigger, on } from 'canvasengine';

  const myTrigger = trigger({
    myData: 'myData'
  })

  on(myTrigger, async (data) => {
    console.log('Triggered with data:', data) // { myData: 'myData', otherData: 'otherData' }
  })

  myTrigger.start({
    otherData: 'otherData'
  })
</script>
```
:::

## Use in child component

`child.ce`
```html
<script>
  import { on } from 'canvasengine';

  const { myEvent } = defineProps()

  on(myEvent, () => {
    console.log('Event triggered')
  })
</script>
```

`parent.ce`

```html
<script>
  import Child from './child.ce';

  const myTrigger = trigger();
</script>

<Child myEvent={myTrigger} />
<Rect x="0" y="0" width="10" height="10" color="red" @click={myTrigger} />
```

## Async

You can use `await` to wait for the trigger to finish.

```html{6,11}
<script>
  import { trigger, on } from 'canvasengine';

  const myTrigger = trigger();

  on(myTrigger, async (data) => {
    console.log('Triggered with data:', data)
  })

  async function run() {
    await myTrigger.start({
      message: 'Hello World'
    })
  }

  run()
</script>
```
