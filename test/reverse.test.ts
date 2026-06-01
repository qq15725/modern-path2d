import { describe, expect, it } from 'vitest'
import {
  CubicBezierCurve,
  LineCurve,
  Path2D,
  QuadraticBezierCurve,
  Vector2,
} from '../src/index'

function densePoly(p: { getPointAt: (u: number) => Vector2 }, n = 1000): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const q = p.getPointAt(i / n)
    out.push([q.x, q.y])
  }
  return out
}

function pointToSeg(px: number, py: number, a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l2 = dx * dx + dy * dy || 1
  let t = ((px - a[0]) * dx + (py - a[1]) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy))
}

function hausdorff(pa: [number, number][], pb: [number, number][]): number {
  let max = 0
  for (const [x, y] of pb) {
    let m = Infinity
    for (let i = 0; i < pa.length - 1; i++) {
      m = Math.min(m, pointToSeg(x, y, pa[i], pa[i + 1]))
    }
    max = Math.max(max, m)
  }
  return max
}

function ringArea(v: number[]): number {
  const n = v.length / 2
  let a = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    a += v[i * 2] * v[j * 2 + 1] - v[j * 2] * v[i * 2 + 1]
  }
  return a / 2
}

describe('reverse()', () => {
  it('leaf curves: same geometry, swapped endpoints', () => {
    const cases = [
      LineCurve.from(0, 0, 100, 50),
      QuadraticBezierCurve.from(0, 0, 50, 100, 100, 0),
      CubicBezierCurve.from(0, 0, 30, 100, 70, -100, 100, 0),
    ]
    for (const c of cases) {
      const start = c.getPoint(0).clone()
      const end = c.getPoint(1).clone()
      const fwd = densePoly(c)
      c.reverse()
      expect(c.getPoint(0).distanceTo(end)).toBeLessThan(1e-6)
      expect(c.getPoint(1).distanceTo(start)).toBeLessThan(1e-6)
      expect(hausdorff(fwd, densePoly(c))).toBeLessThan(1e-3)
    }
  })

  it('Path2D with mixed segments reverses geometry', () => {
    const build = (p: Path2D): void => {
      p.moveTo(0, 0)
      p.lineTo(100, 0)
      p.quadraticCurveTo(150, 50, 100, 100)
      p.lineTo(0, 100)
    }
    const a = new Path2D()
    build(a)
    const b = new Path2D()
    build(b)
    b.reverse()
    // compare the geometry via the (dense, exact) adaptive outlines, which avoids the arc-length
    // reparameterization jitter of getPointAt
    const toPoly = (p: Path2D): [number, number][] => {
      const v = p.getAdaptiveVertices()
      const out: [number, number][] = []
      for (let i = 0; i < v.length; i += 2) {
        out.push([v[i], v[i + 1]])
      }
      return out
    }
    expect(hausdorff(toPoly(a), toPoly(b))).toBeLessThan(1e-3)
    expect(a.getPoint(0).distanceTo(b.getPoint(1))).toBeLessThan(1e-6)
    expect(a.getPoint(1).distanceTo(b.getPoint(0))).toBeLessThan(1e-6)
  })

  it('reversing a closed shape flips orientation but keeps geometry & resolution', () => {
    const a = new Path2D()
    a.arc(50, 50, 40, 0, Math.PI * 2, true)
    const b = new Path2D()
    b.arc(50, 50, 40, 0, Math.PI * 2, true)
    b.reverse()
    const va = a.getAdaptiveVertices()
    const vb = b.getAdaptiveVertices()
    expect(vb.length).toBe(va.length) // full-circle reverse keeps the dense sampler
    expect(Math.sign(ringArea(va))).toBe(-Math.sign(ringArea(vb)))
  })

  it('reversing twice restores direction', () => {
    const r = new Path2D()
    r.rect(10, 10, 80, 40)
    const before = r.getPoint(0.3).clone()
    r.reverse().reverse()
    expect(r.getPoint(0.3).distanceTo(before)).toBeLessThan(1e-6)
  })
})
