import { describe, expect, it } from 'vitest'
import { ArcCurve, CurvePath, LineCurve, Path2D, Transform2D } from '../src/index'

describe('cache invalidation', () => {
  it('applyTransform invalidates the arc-length cache', () => {
    const line = LineCurve.from(0, 0, 10, 0)
    expect(line.getLength()).toBeCloseTo(10)
    line.applyTransform(new Transform2D().scale(2, 2))
    expect(line.getLength()).toBeCloseTo(20)
  })

  it('Path2D.applyTransform invalidates the hit-test ring cache', () => {
    const p = new Path2D()
    p.moveTo(0, 0).lineTo(10, 0).lineTo(10, 10).lineTo(0, 10).closePath()
    expect(p.contains(5, 5)).toBe(true) // builds the ring cache
    p.applyTransform(new Transform2D().translate(100, 0))
    expect(p.contains(5, 5)).toBe(false) // shifted away -> cache refreshed
    expect(p.contains(105, 5)).toBe(true)
  })

  it('Path2D.scale invalidates the hit-test ring cache', () => {
    const p = new Path2D()
    p.moveTo(0, 0).lineTo(10, 0).lineTo(10, 10).lineTo(0, 10).closePath()
    expect(p.contains(8, 8)).toBe(true)
    p.scale(0.5, 0.5)
    expect(p.contains(8, 8)).toBe(false) // now spans 0..5
    expect(p.contains(2, 2)).toBe(true)
  })

  it('CurvePath recomputes the cached outline when sub-curves are added', () => {
    const cp = new CurvePath()
    cp.moveTo(0, 0).lineTo(10, 0)
    expect(cp.isPointInStroke({ x: 20, y: 0 }, { strokeWidth: 2 })).toBe(false) // caches [0..10]
    cp.lineTo(30, 0)
    expect(cp.isPointInStroke({ x: 20, y: 0 }, { strokeWidth: 2 })).toBe(true) // length changed -> recomputed
  })

  it('transforming a nested sub-path bubbles up to the Path2D ring cache', () => {
    const p = new Path2D()
    p.moveTo(0, 0).lineTo(10, 0).lineTo(10, 10).lineTo(0, 10).closePath()
    expect(p.contains(5, 5)).toBe(true) // builds ring cache + records child owners
    p.curves[0].applyTransform(new Transform2D().translate(100, 0)) // transform just one sub-path
    expect(p.contains(5, 5)).toBe(false) // bubbled invalidation refreshed the Path2D cache
    expect(p.contains(105, 5)).toBe(true)
  })

  it('ArcCurve.applyTransform invalidates the length cache', () => {
    const arc = new ArcCurve(0, 0, 10)
    const before = arc.getLength()
    arc.applyTransform(new Transform2D().scale(2, 2))
    expect(arc.getLength()).toBeCloseTo(before * 2, 0)
  })

  it('manual invalidate() picks up in-place control-point mutation', () => {
    const line = LineCurve.from(0, 0, 10, 0)
    expect(line.getLength()).toBeCloseTo(10)
    line.p2.x = 20 // mutating coordinates directly does not auto-invalidate
    line.invalidate()
    expect(line.getLength()).toBeCloseTo(20)
  })
})
