import { describe, expect, it } from 'vitest'
import { nonzeroFillRule } from '../src/index'

describe('nonzeroFillRule', () => {
  const outer = [0, 0, 100, 0, 100, 100, 0, 100] // CW
  const innerOpposite = [25, 25, 25, 75, 75, 75, 75, 25] // CCW

  it('marks a nested opposite-wound ring as a hole of its parent', () => {
    const res = nonzeroFillRule([outer, innerOpposite])
    expect(res[0].parentIndex).toBeUndefined() // outer is top-level
    expect(res[1].parentIndex).toBe(0) // inner is inside outer
  })

  it('leaves disjoint rings parentless (AABB prefilter path)', () => {
    const a = [0, 0, 10, 0, 10, 10, 0, 10]
    const b = [1000, 1000, 1010, 1000, 1010, 1010, 1000, 1010]
    const res = nonzeroFillRule([a, b])
    expect(res[0].parentIndex).toBeUndefined()
    expect(res[1].parentIndex).toBeUndefined()
  })

  it('handles empty rings without throwing', () => {
    const res = nonzeroFillRule([outer, []])
    expect(res).toHaveLength(2)
    expect(res[0].parentIndex).toBeUndefined()
  })

  it('scales to many disjoint rings (prefilter keeps them independent)', () => {
    const rings: number[][] = []
    for (let i = 0; i < 50; i++) {
      const x = i * 100
      rings.push([x, 0, x + 10, 0, x + 10, 10, x, 10])
    }
    const res = nonzeroFillRule(rings)
    expect(res.every(r => r.parentIndex === undefined)).toBe(true)
  })
})
