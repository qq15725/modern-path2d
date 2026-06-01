import { describe, expect, it } from 'vitest'
import { Path2D } from '../src/index'

/** Absolute total signed area across all sub-path rings. */
function area(path: Path2D): number {
  let total = 0
  for (const sub of path.curves) {
    const v = sub.getAdaptiveVertices()
    const n = v.length / 2
    if (n < 3) {
      continue
    }
    let a = 0
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      a += v[i * 2] * v[j * 2 + 1] - v[j * 2] * v[i * 2 + 1]
    }
    total += a / 2
  }
  return Math.abs(total)
}

function square(x: number, y: number, s: number): Path2D {
  const p = new Path2D()
  p.rect(x, y, s, s)
  return p
}

function ringCount(path: Path2D): number {
  return path.curves.filter(c => c.curves.length).length
}

describe('boolean ops', () => {
  // A = [0,0,10,10], B = [5,5,15,15] → overlap is a 5×5 square
  const A = square(0, 0, 10)
  const B = square(5, 5, 10)

  it('union covers both areas minus the overlap', () => {
    expect(area(A.union(B))).toBeCloseTo(175, 1)
  })

  it('intersection is only the overlap', () => {
    expect(area(A.intersection(B))).toBeCloseTo(25, 1)
  })

  it('difference subtracts the clip', () => {
    expect(area(A.difference(B))).toBeCloseTo(75, 1)
  })

  it('xor is the symmetric difference', () => {
    expect(area(A.xor(B))).toBeCloseTo(150, 1)
  })

  it('difference of concentric circles makes a real hole', () => {
    const big = new Path2D()
    big.arc(50, 50, 40, 0, Math.PI * 2, true)
    const small = new Path2D()
    small.arc(50, 50, 20, 0, Math.PI * 2, true)
    const donut = big.difference(small)
    expect(ringCount(donut)).toBe(2)
    expect(donut.isPointInFill({ x: 50, y: 50 })).toBe(false) // hole
    expect(donut.isPointInFill({ x: 50, y: 15 })).toBe(true) // ring band
    expect(donut.isPointInFill({ x: 50, y: 5 })).toBe(false) // outside
  })

  it('union of disjoint shapes yields two rings', () => {
    expect(ringCount(square(0, 0, 5).union(square(100, 100, 5)))).toBe(2)
  })

  it('result inherits style with overrides', () => {
    A.style.fill = 'red'
    const out = A.union(B, { fill: 'blue' })
    expect(out.style.fill).toBe('blue')
  })
})
