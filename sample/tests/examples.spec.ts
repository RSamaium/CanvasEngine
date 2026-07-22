import { describe, expect, test } from 'vitest'
import {
  DEFAULT_EXAMPLE_SLUG,
  EXAMPLES,
  getExample,
  getExampleUrl,
} from '../src/examples'

describe('sample catalogue', () => {
  test('has unique slugs and a title for every entry', () => {
    const slugs = EXAMPLES.map((example) => example.slug)

    expect(new Set(slugs).size).toBe(slugs.length)
    expect(EXAMPLES.every((example) => example.title.trim().length > 0)).toBe(true)
  })

  test('uses sprite shadows as the default for missing and unknown slugs', () => {
    expect(getExample(null).slug).toBe(DEFAULT_EXAMPLE_SLUG)
    expect(getExample('does-not-exist').slug).toBe(DEFAULT_EXAMPLE_SLUG)
  })

  test('resolves a known example', () => {
    expect(getExample('hud-hp-sp').title).toBe('HUD · HP / SP')
  })

  test('builds an example URL while preserving other query parameters and hashes', () => {
    expect(
      getExampleUrl('weather', 'https://example.test/samples/?debug=1#demo'),
    ).toBe('/samples/?debug=1&example=weather#demo')
  })
})
