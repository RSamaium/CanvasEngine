import { describe, expect, it } from 'vitest'
import {
  Container,
  Rect,
  Text,
  h,
  signal,
  type ComponentInstance,
  type Element,
} from 'canvasengine'
import { TestBed } from '../../packages/core/testing'
import { Bar } from '../../packages/presets/src/Bar'

describe('Bar preset', () => {
  it('keeps sibling bars in place when a reactive value changes', async () => {
    const hp = signal(82)
    const sp = signal(46)

    const root = await TestBed.createComponent(Container, {
      width: '100%',
      height: '100%',
    }, [
      h(Container, {
        positionType: 'absolute',
        left: 28,
        bottom: 28,
        width: 700,
        height: 252,
      }, [
        h(Container, { width: 700, height: 252 }, [
          h(Rect, { x: 8, y: 10, width: 700, height: 252, color: '#02050b' }),
          h(Rect, { width: 700, height: 252, color: '#101a2a' }),
          h(Text, { x: 228, y: 31, text: 'CAEL ARDENT' }),
          h(Text, { x: 228, y: 77, text: 'HP' }),
          h(Bar, {
            x: 228,
            y: 98,
            width: 420,
            height: 22,
            value: hp,
            maxValue: 100,
          }),
          h(Text, { x: 228, y: 131, text: 'SP' }),
          h(Bar, {
            x: 228,
            y: 152,
            width: 420,
            height: 22,
            value: sp,
            maxValue: 60,
          }),
        ]),
      ]),
    ])

    const panel = root.props.children?.[0] as Element<ComponentInstance>
    const content = panel.props.children?.[0] as Element<ComponentInstance>
    const hpBar = content.props.children?.[4] as Element<ComponentInstance>
    const spBar = content.props.children?.[6] as Element<ComponentInstance>

    expect(hpBar.props.children).toHaveLength(0)
    expect(hpBar.props.border).toBeUndefined()

    await new Promise((resolve) => setTimeout(resolve, 20))
    root.props.context.app().render()

    const initialHpPosition = {
      x: hpBar.componentInstance.x,
      y: hpBar.componentInstance.y,
    }
    const initialSpPosition = {
      x: spBar.componentInstance.x,
      y: spBar.componentInstance.y,
    }

    hp.set(64)
    await new Promise((resolve) => setTimeout(resolve, 20))
    root.props.context.app().render()

    expect({
      x: hpBar.componentInstance.x,
      y: hpBar.componentInstance.y,
    }).toEqual(initialHpPosition)
    expect({
      x: spBar.componentInstance.x,
      y: spBar.componentInstance.y,
    }).toEqual(initialSpPosition)
  })
})
