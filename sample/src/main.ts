import { bootstrapCanvas } from 'canvasengine'
import {
  EXAMPLES,
  getExample,
  getExampleUrl,
} from './examples'

const requestedSlug = new URLSearchParams(window.location.search).get('example')
const activeExample = getExample(requestedSlug)

if (requestedSlug !== activeExample.slug) {
  window.history.replaceState(
    {},
    '',
    getExampleUrl(activeExample.slug, window.location.href),
  )
}

const list = document.querySelector<HTMLElement>('[data-sample-list]')
const title = document.querySelector<HTMLElement>('[data-sample-title]')

if (title) title.textContent = activeExample.title
document.title = `${activeExample.title} · CanvasEngine Samples`

for (const example of EXAMPLES) {
  const link = document.createElement('a')
  link.className = 'sample-link'
  link.href = getExampleUrl(example.slug, window.location.href)
  link.textContent = example.title

  if (example.slug === activeExample.slug) {
    link.classList.add('is-active')
    link.setAttribute('aria-current', 'page')
  }

  list?.append(link)
}

activeExample.load().then(({ default: App }) =>
  bootstrapCanvas(document.getElementById('root'), App),
).then(() => {
  console.log(`CanvasEngine sample initialized: ${activeExample.slug}`)
}).catch((error) => {
  console.error(`Unable to load CanvasEngine sample: ${activeExample.slug}`, error)
})
