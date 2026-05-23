import type { Curve } from '../src/index'
import { describe, expect, it } from 'vitest'
import {
  ArcCurve,
  CubicBezierCurve,
  EllipseCurve,
  LineCurve,
  Path2D,
  QuadraticBezierCurve,
  Vector2,
} from '../src/index'

function sample(curve: Curve, n = 4000): { minX: number, minY: number, maxX: number, maxY: number } {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const p = new Vector2()
  for (let i = 0; i <= n; i++) {
    curve.getPoint(i / n, p)
    if (p.x < minX)
      minX = p.x
    if (p.y < minY)
      minY = p.y
    if (p.x > maxX)
      maxX = p.x
    if (p.y > maxY)
      maxY = p.y
  }
  return { minX, minY, maxX, maxY }
}

// Analytical bounds must CONTAIN the densely-sampled curve and be no looser than `tol`.
function expectTightBounds(curve: Curve, tol = 0.05): void {
  const { min, max } = curve.getMinMax()
  const s = sample(curve)
  expect(min.x).toBeLessThanOrEqual(s.minX + 1e-6)
  expect(min.y).toBeLessThanOrEqual(s.minY + 1e-6)
  expect(max.x).toBeGreaterThanOrEqual(s.maxX - 1e-6)
  expect(max.y).toBeGreaterThanOrEqual(s.maxY - 1e-6)
  expect(min.x).toBeGreaterThan(s.minX - tol)
  expect(min.y).toBeGreaterThan(s.minY - tol)
  expect(max.x).toBeLessThan(s.maxX + tol)
  expect(max.y).toBeLessThan(s.maxY + tol)
}

describe('getMinMax', () => {
  it('LineCurve is the exact corner box', () => {
    const { min, max } = LineCurve.from(0, 0, 10, 20).getMinMax()
    expect(min).toMatchObject({ x: 0, y: 0 })
    expect(max).toMatchObject({ x: 10, y: 20 })
  })

  it('QuadraticBezier accounts for the interior extremum', () => {
    const q = QuadraticBezierCurve.from(0, 0, 50, 100, 100, 0)
    const { min, max } = q.getMinMax()
    expect(min).toMatchObject({ x: 0, y: 0 })
    // peak is at the curve, not at the control point (y=50, not 100)
    expect(max.x).toBeCloseTo(100)
    expect(max.y).toBeCloseTo(50)
    expectTightBounds(q)
  })

  it('CubicBezier accounts for interior extrema', () => {
    expectTightBounds(CubicBezierCurve.from(0, 0, 0, 100, 100, 100, 100, 0))
    expectTightBounds(CubicBezierCurve.from(10, 10, 200, -50, -50, 200, 90, 90))
  })

  it('full circle is exact', () => {
    const { min, max } = new ArcCurve(0, 0, 10).getMinMax()
    expect(min.x).toBeCloseTo(-10)
    expect(min.y).toBeCloseTo(-10)
    expect(max.x).toBeCloseTo(10)
    expect(max.y).toBeCloseTo(10)
  })

  it('partial arcs match the swept geometry', () => {
    expectTightBounds(new ArcCurve(0, 0, 10, 0, Math.PI / 2, true))
    expectTightBounds(new ArcCurve(5, 5, 8, Math.PI / 4, Math.PI, false))
  })

  it('rotated ellipse (full and partial)', () => {
    expectTightBounds(new EllipseCurve(0, 0, 20, 10, Math.PI / 6, 0, Math.PI * 2))
    expectTightBounds(new EllipseCurve(3, -2, 15, 6, Math.PI / 3, Math.PI / 5, Math.PI * 1.3, true))
  })
})

describe('Path2D.getMinMax stroke expansion', () => {
  function square(strokeWidth: number): Path2D {
    const p = new Path2D(undefined, { stroke: '#000', strokeWidth })
    p.moveTo(0, 0).lineTo(100, 0).lineTo(100, 100).lineTo(0, 100).closePath()
    return p
  }

  it('inflates geometry by half the stroke width', () => {
    const p = square(10)
    const geo = p.getMinMax(undefined, undefined, false)
    expect(geo.min).toMatchObject({ x: 0, y: 0 })
    expect(geo.max).toMatchObject({ x: 100, y: 100 })

    const stroked = p.getMinMax(undefined, undefined, true)
    expect(stroked.min).toMatchObject({ x: -5, y: -5 })
    expect(stroked.max).toMatchObject({ x: 105, y: 105 })
  })

  it('does not inflate when strokeWidth <= 1', () => {
    const stroked = square(1).getMinMax(undefined, undefined, true)
    expect(stroked.min).toMatchObject({ x: 0, y: 0 })
    expect(stroked.max).toMatchObject({ x: 100, y: 100 })
  })
})
