import { describe, expect, it } from 'vitest'
import { Transform2D, Vector2 } from '../src/index'

describe('Vector2', () => {
  it('arithmetic', () => {
    expect(new Vector2(1, 2).add({ x: 3, y: 4 })).toMatchObject({ x: 4, y: 6 })
    expect(new Vector2(5, 5).sub({ x: 1, y: 2 })).toMatchObject({ x: 4, y: 3 })
    expect(new Vector2(2, 3).multiply(2)).toMatchObject({ x: 4, y: 6 })
    expect(new Vector2(4, 6).divide(2)).toMatchObject({ x: 2, y: 3 })
  })

  it('dot / cross / distance / length', () => {
    expect(new Vector2(1, 2).dot({ x: 3, y: 4 })).toBe(11)
    expect(new Vector2(1, 0).cross({ x: 0, y: 1 })).toBe(1)
    expect(new Vector2(0, 0).distanceTo({ x: 3, y: 4 })).toBe(5)
    expect(new Vector2(3, 4).getLength()).toBe(5)
    expect(new Vector2(3, 4).lengthSquared()).toBe(25)
  })

  it('normalize to unit length', () => {
    const v = new Vector2(3, 4).normalize()
    expect(v.x).toBeCloseTo(0.6)
    expect(v.y).toBeCloseTo(0.8)
    expect(v.getLength()).toBeCloseTo(1)
  })

  it('rotate takes radians', () => {
    const v = new Vector2(1, 0).rotate(Math.PI / 2)
    expect(v.x).toBeCloseTo(0)
    expect(v.y).toBeCloseTo(1)
  })

  it('scale about an origin', () => {
    expect(new Vector2(2, 2).scale(2, 2, { x: 1, y: 1 })).toMatchObject({ x: 3, y: 3 })
  })

  it('lerp / clone / equals', () => {
    expect(Vector2.lerp({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toMatchObject({ x: 5, y: 10 })
    const a = new Vector2(1, 2)
    const b = a.clone()
    expect(b.equals(a)).toBe(true)
    expect(b).not.toBe(a)
  })

  it('onUpdate fires on mutation', () => {
    let calls = 0
    const v = new Vector2(0, 0, () => { calls++ })
    v.x = 1
    v.set(2, 3)
    v.x = 2 // unchanged on x but set also y -> set fires once
    expect(calls).toBeGreaterThanOrEqual(2)
  })
})

describe('Transform2D', () => {
  it('identity / translate / scale / rotate apply', () => {
    expect(new Transform2D().apply({ x: 3, y: 4 })).toMatchObject({ x: 3, y: 4 })
    expect(new Transform2D().translate(10, 20).apply({ x: 0, y: 0 })).toMatchObject({ x: 10, y: 20 })
    expect(new Transform2D().scale(2, 3).apply({ x: 1, y: 1 })).toMatchObject({ x: 2, y: 3 })
    const r = new Transform2D().rotate(Math.PI / 2).apply({ x: 1, y: 0 })
    expect(r.x).toBeCloseTo(0)
    expect(r.y).toBeCloseTo(1)
  })

  it('append and prepend compose "apply A then B" as B·A', () => {
    const A = new Transform2D().translate(10, 0)
    const B = new Transform2D().scale(2, 2)
    const viaAppend = B.clone().append(A.clone()).apply({ x: 1, y: 1 })
    const viaPrepend = A.clone().prepend(B.clone()).apply({ x: 1, y: 1 })
    expect(viaAppend).toMatchObject({ x: 22, y: 2 })
    expect(viaPrepend).toMatchObject({ x: 22, y: 2 })
  })

  it('decompose extracts scale and rotation', () => {
    const t = new Transform2D().setTransform(0, 0, 0, 0, 2, 3, Math.PI / 6, 0, 0)
    const d = t.decompose()
    expect(d.scale.x).toBeCloseTo(2)
    expect(d.scale.y).toBeCloseTo(3)
    expect(d.rotation).toBeCloseTo(Math.PI / 6)
  })

  it('affineInverse round-trips a point', () => {
    const m = new Transform2D().setTransform(5, 7, 0, 0, 2, 1.5, Math.PI / 5, 0, 0)
    const p = { x: 3, y: 4 }
    const back = m.affineInverse().apply(m.apply(p))
    expect(back.x).toBeCloseTo(3)
    expect(back.y).toBeCloseTo(4)
  })

  it('prependCssTransform parses matrix / translate / rotate(deg)', () => {
    expect(new Transform2D().prependCssTransform('matrix(1,0,0,1,10,20)').apply({ x: 0, y: 0 }))
      .toMatchObject({ x: 10, y: 20 })
    expect(new Transform2D().prependCssTransform('translate(10, 20)').apply({ x: 0, y: 0 }))
      .toMatchObject({ x: 10, y: 20 })
    const r = new Transform2D().prependCssTransform('rotate(90deg)').apply({ x: 1, y: 0 })
    expect(r.x).toBeCloseTo(0)
    expect(r.y).toBeCloseTo(1)
  })
})
