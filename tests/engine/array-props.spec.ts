import { beforeEach, describe, expect, test } from 'vitest'
import { signal } from 'canvasengine'
import { createComponent, registerComponent } from '../../packages/core/src/engine/reactive'

describe('Array props', () => {
  class Recorder {
    updates: any[] = []
    onInit() {}
    onUpdate(props) {
      this.updates.push(props)
    }
    onMount() {}
  }

  beforeEach(() => {
    registerComponent('Recorder', Recorder)
  })

  const lastValue = (element, key) => {
    const updates = (element.componentInstance as Recorder).updates.filter((u) => key in u)
    return updates[updates.length - 1]?.[key]
  }

  describe('signals inside an array literal', () => {
    test('resolves the signals to their values', () => {
      const spin = signal(1)
      const element = createComponent('Recorder', { rotation: [0, spin, 0] })
      expect(element.props.rotation).toEqual([0, 1, 0])
    })

    test('sends the whole array again when one signal changes', () => {
      const spin = signal(1)
      const element = createComponent('Recorder', { rotation: [0, spin, 0] })
      spin.set(2)
      expect(lastValue(element, 'rotation')).toEqual([0, 2, 0])
      expect(element.props.rotation).toEqual([0, 2, 0])
    })

    test('works in a nested object prop', () => {
      const color = signal(0xff0000)
      const element = createComponent('Recorder', { material: { tint: [color, 1] } })
      color.set(0x00ff00)
      expect(element.props.material.tint).toEqual([0x00ff00, 1])
    })

    test('stops tracking once the element is destroyed', () => {
      const spin = signal(1)
      const element = createComponent('Recorder', { rotation: [0, spin, 0] })
      const recorder = element.componentInstance as Recorder
      element.propSubscriptions.forEach((sub) => sub.unsubscribe())
      const count = recorder.updates.length
      spin.set(5)
      expect(recorder.updates.length).toBe(count)
    })

    test('leaves arrays without signals untouched', () => {
      const position = [1, 2, 3]
      const element = createComponent('Recorder', { position })
      expect(element.props.position).toBe(position)
    })
  })

  describe('array signals', () => {
    test('pass the array, not the change record', () => {
      const position = signal([0, 1, 2])
      const element = createComponent('Recorder', { position })
      position.set([3, 4, 5])
      expect(lastValue(element, 'position')).toEqual([3, 4, 5])
    })

    test('pass the whole array after a mutation', () => {
      const path = signal([1, 2])
      const element = createComponent('Recorder', { path })
      path().push(3)
      expect(lastValue(element, 'path')).toEqual([1, 2, 3])
    })
  })
})
