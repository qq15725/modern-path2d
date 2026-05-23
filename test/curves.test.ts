import { describe, expect, it } from 'vitest'
import {
  ArcCurve,
  CubicBezierCurve,
  LineCurve,
  QuadraticBezierCurve,
  RectangleCurve,
  RoundRectangleCurve,
  SplineCurve,
  Transform2D,
  Vector2,
} from '../src/index'

describe('LineCurve', () => {
  const line = LineCurve.from(0, 0, 10, 20)

  it('interpolates endpoints and midpoint', () => {
    expect(line.getPoint(0)).toMatchObject({ x: 0, y: 0 })
    expect(line.getPoint(1)).toMatchObject({ x: 10, y: 20 })
    expect(line.getPoint(0.5)).toMatchObject({ x: 5, y: 10 })
  })

  it('length is the straight distance', () => {
    expect(LineCurve.from(0, 0, 3, 4).getLength()).toBeCloseTo(5)
  })

  it('exposes control point refs', () => {
    expect(line.getControlPointRefs()).toHaveLength(2)
  })
})

describe('bezier endpoints', () => {
  it('Quadratic passes through p1 and p2', () => {
    const q = QuadraticBezierCurve.from(0, 0, 50, 100, 100, 0)
    expect(q.getPoint(0)).toMatchObject({ x: 0, y: 0 })
    expect(q.getPoint(1)).toMatchObject({ x: 100, y: 0 })
  })

  it('Cubic passes through p1 and p2', () => {
    const c = CubicBezierCurve.from(0, 0, 0, 100, 100, 100, 100, 0)
    expect(c.getPoint(0)).toMatchObject({ x: 0, y: 0 })
    expect(c.getPoint(1)).toMatchObject({ x: 100, y: 0 })
  })

  it('clone is a deep copy', () => {
    const c = CubicBezierCurve.from(0, 0, 1, 1, 2, 2, 3, 3)
    const d = c.clone()
    c.p1.x = 100
    expect(d.p1.x).toBe(0)
  })
})

describe('ArcCurve', () => {
  it('full circle length ≈ 2πr', () => {
    expect(new ArcCurve(0, 0, 10).getLength()).toBeCloseTo(2 * Math.PI * 10, 1)
  })

  it('isClockwise reflects the flag', () => {
    expect(new ArcCurve(0, 0, 10, 0, Math.PI, true).isClockwise()).toBe(true)
    expect(new ArcCurve(0, 0, 10, 0, Math.PI, false).isClockwise()).toBe(false)
  })
})

describe('RectangleCurve', () => {
  const rect = new RectangleCurve(10, 20, 30, 40)

  it('fill vertices are the four corners', () => {
    expect(rect.getFillVertices()).toEqual([10, 20, 40, 20, 40, 60, 10, 60])
  })

  it('bounds equal the rectangle', () => {
    const { min, max } = rect.getMinMax()
    expect(min).toMatchObject({ x: 10, y: 20 })
    expect(max).toMatchObject({ x: 40, y: 60 })
  })

  it('contains its center', () => {
    expect(rect.isPointInFill({ x: 25, y: 40 })).toBe(true)
    expect(rect.isPointInFill({ x: 0, y: 0 })).toBe(false)
  })
})

describe('RoundRectangleCurve', () => {
  const rr = new RoundRectangleCurve(10, 20, 100, 60, 10)

  it('is a real composite (4 lines + 4 arcs)', () => {
    expect(rr.curves).toHaveLength(8)
  })

  it('bounds equal the rectangle box', () => {
    const { min, max } = rr.getMinMax()
    expect(min.x).toBeCloseTo(10)
    expect(min.y).toBeCloseTo(20)
    expect(max.x).toBeCloseTo(110)
    expect(max.y).toBeCloseTo(80)
  })

  it('starts at (x+r, y) and the perimeter accounts for rounded corners', () => {
    expect(rr.getPoint(0)).toMatchObject({ x: 20, y: 20 })
    // 2(w-2r) + 2(h-2r) + 2πr
    expect(rr.getLength()).toBeCloseTo(240 + 2 * Math.PI * 10, 0)
  })

  it('clips the rounded corners in hit testing', () => {
    expect(rr.isPointInFill({ x: 60, y: 50 })).toBe(true) // center
    expect(rr.isPointInFill({ x: 15, y: 25 })).toBe(true) // inside the corner radius
    expect(rr.isPointInFill({ x: 11, y: 21 })).toBe(false) // clipped corner
    expect(rr.isPointInFill({ x: 5, y: 5 })).toBe(false) // outside
  })

  it('degenerates to a rectangle when radius <= 0', () => {
    const plain = new RoundRectangleCurve(0, 0, 10, 10, 0)
    expect(plain.curves).toHaveLength(4)
  })
})

describe('SplineCurve', () => {
  const spline = new SplineCurve([
    new Vector2(0, 0),
    new Vector2(10, 10),
    new Vector2(20, 0),
  ])

  it('passes through first and last points', () => {
    expect(spline.getPoint(0)).toMatchObject({ x: 0, y: 0 })
    expect(spline.getPoint(1)).toMatchObject({ x: 20, y: 0 })
  })

  it('samples a non-empty outline', () => {
    expect(spline.getAdaptiveVertices().length).toBeGreaterThan(0)
  })
})

describe('applyTransform', () => {
  it('translates control points', () => {
    const line = LineCurve.from(0, 0, 10, 0)
    line.applyTransform(new Transform2D().translate(5, 5))
    expect(line.p1).toMatchObject({ x: 5, y: 5 })
    expect(line.p2).toMatchObject({ x: 15, y: 5 })
  })
})
