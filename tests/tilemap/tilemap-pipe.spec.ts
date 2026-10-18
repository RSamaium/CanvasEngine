import { describe, expect, it } from 'vitest'
import { GlobalUniformSystem, Matrix, Point } from 'pixi.js'
import { TilemapPipe } from '../../packages/tilemap/lib/index.mjs'

// Regression for #76: the pipe must use the current global uniform context, not the
// last entry of globalUniforms._activeUniforms (a per-frame pool, not a stack).
describe('TilemapPipe.execute with a nested filter pass', () => {
  it('uses the parent filter context after the nested pass was popped', () => {
    const globalUniforms = new GlobalUniformSystem({ renderTarget: { renderTarget: { size: [100, 100] }, projectionMatrix: new Matrix() }, renderPipes: {}, type: 1 } as any)
    const projectionMatrix = new Matrix()
    globalUniforms.push({ projectionMatrix, worldTransformMatrix: new Matrix(), offset: new Point(153, 122) } as any)
    globalUniforms.push({ projectionMatrix, worldTransformMatrix: new Matrix(), offset: new Point(423, 524) } as any)
    globalUniforms.pop()

    const renderer = { globalUniforms } as any
    const pipe = new TilemapPipe(renderer, {
      pipe_uniforms: { uniforms: { u_proj_trans: new Matrix(), u_anim_frame: new Float32Array(2) }, update() {} },
      init() {}, execute() {}
    } as any)
    const tilemap = { isRenderable: true, state: {}, worldTransform: new Matrix(), tileAnim: [0, 0] } as any

    pipe.execute({ tilemap })

    const { u_proj_trans } = (pipe as any).adaptor.pipe_uniforms.uniforms
    expect(u_proj_trans.tx).toBe(-153)
    expect(u_proj_trans.ty).toBe(-122)
  })
})
