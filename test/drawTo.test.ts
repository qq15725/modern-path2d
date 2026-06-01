import { describe, expect, it, vi } from 'vitest'
import { Path2D } from '../src/index'

/** Minimal CanvasRenderingContext2D stub that records the fill rule passed to `fill()`. */
function mockCtx(): { ctx: CanvasRenderingContext2D, fillCalls: any[] } {
  const fillCalls: any[] = []
  const noop = (): void => {}
  const ctx = {
    beginPath: noop,
    save: noop,
    restore: noop,
    moveTo: noop,
    lineTo: noop,
    bezierCurveTo: noop,
    quadraticCurveTo: noop,
    ellipse: noop,
    arc: noop,
    closePath: noop,
    stroke: noop,
    fill: vi.fn((...args: any[]) => fillCalls.push(args)),
    setLineDash: noop,
    canvas: { width: 100, height: 100 },
  } as unknown as CanvasRenderingContext2D
  return { ctx, fillCalls }
}

describe('Path2D.drawTo fill rule', () => {
  it('passes evenodd through to ctx.fill', () => {
    const { ctx, fillCalls } = mockCtx()
    const p = new Path2D().addData('M0 0 H10 V10 H0 Z')
    p.style.fill = '#000'
    p.style.fillRule = 'evenodd'
    p.drawTo(ctx)
    expect(fillCalls).toHaveLength(1)
    expect(fillCalls[0][0]).toBe('evenodd')
  })

  it('defaults to nonzero', () => {
    const { ctx, fillCalls } = mockCtx()
    const p = new Path2D().addData('M0 0 H10 V10 H0 Z')
    p.style.fill = '#000'
    p.drawTo(ctx)
    expect(fillCalls[0][0]).toBe('nonzero')
  })

  it('does not fill when fill is none', () => {
    const { ctx, fillCalls } = mockCtx()
    const p = new Path2D().addData('M0 0 H10 V10 H0 Z')
    p.drawTo(ctx, { fill: 'none', stroke: '#000' })
    expect(fillCalls).toHaveLength(0)
  })
})
