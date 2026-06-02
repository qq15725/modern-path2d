import { describe, expect, it } from 'vitest'
import { Path2D, Transform2D } from '../src/index'

function inTriangle(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number): boolean {
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
  const a = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d
  const b = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d
  const c = 1 - a - b
  return a >= -1e-6 && b >= -1e-6 && c >= -1e-6
}

function covered(r: { vertices: number[], indices: number[] }, px: number, py: number): boolean {
  const { vertices: V, indices: I } = r
  for (let i = 0; i < I.length; i += 3) {
    const x = I[i]
    const y = I[i + 1]
    const z = I[i + 2]
    if (inTriangle(px, py, V[x * 2], V[x * 2 + 1], V[y * 2], V[y * 2 + 1], V[z * 2], V[z * 2 + 1])) {
      return true
    }
  }
  return false
}

const DONUT = 'M0 50 A50 50 0 1 0 100 50 A50 50 0 1 0 0 50 Z M28 50 A22 22 0 1 1 72 50 A22 22 0 1 1 28 50 Z'

describe('fillTriangulate fill rule (WebGL path)', () => {
  it('evenodd donut triangulation has a real hole', () => {
    const p = new Path2D().addData(DONUT)
    p.style.fillRule = 'evenodd'
    const r = p.fillTriangulate()
    expect(covered(r, 50, 50)).toBe(false) // hole at center (r<22)
    expect(covered(r, 50, 15)).toBe(true) // ring band (r35) is filled
    expect(covered(r, 5, 5)).toBe(false) // corner — outside the outer circle (r≈63>50)
  })

  it('options.fillRule overrides style.fillRule', () => {
    const p = new Path2D().addData(DONUT) // style.fillRule left default (nonzero)
    const r = p.fillTriangulate({ fillRule: 'evenodd' })
    expect(covered(r, 50, 50)).toBe(false) // evenodd hole, driven purely by the option
    expect(covered(r, 50, 15)).toBe(true)
  })

  it('nonzero donut triangulation also holes (regression)', () => {
    const p = new Path2D().addData(DONUT)
    p.style.fillRule = 'nonzero'
    const r = p.fillTriangulate()
    expect(covered(r, 50, 50)).toBe(false)
    expect(covered(r, 50, 15)).toBe(true)
  })

  it('same-winding nested rings: nonzero stays solid, evenodd holes (fillRule has effect)', () => {
    // inner circle wound the SAME way as the outer (both sweep 0): under nonzero the centre has
    // winding 2 → filled; under evenodd parity → hole. The two rules MUST differ here.
    const SAME = 'M0 50 A50 50 0 1 0 100 50 A50 50 0 1 0 0 50 Z'
      + ' M28 50 A22 22 0 1 0 72 50 A22 22 0 1 0 28 50 Z'
    const nz = (() => { const p = new Path2D().addData(SAME); p.style.fillRule = 'nonzero'; return p.fillTriangulate() })()
    const eo = (() => { const p = new Path2D().addData(SAME); p.style.fillRule = 'evenodd'; return p.fillTriangulate() })()
    expect(covered(nz, 50, 50)).toBe(true) // nonzero → centre filled (winding 2)
    expect(covered(eo, 50, 50)).toBe(false) // evenodd → centre is a hole
    expect(nz.indices).not.toEqual(eo.indices) // the rules genuinely diverge
  })

  it('opposite-winding donut: both rules agree (and that is correct)', () => {
    // the conventional SVG donut (outer/inner wound opposite) is a hole under BOTH rules,
    // so identical tessellation is correct — not a sign the fill rule is ignored.
    const nz = (() => { const p = new Path2D().addData(DONUT); p.style.fillRule = 'nonzero'; return p.fillTriangulate() })()
    const eo = (() => { const p = new Path2D().addData(DONUT); p.style.fillRule = 'evenodd'; return p.fillTriangulate() })()
    expect(covered(nz, 50, 50)).toBe(false)
    expect(covered(eo, 50, 50)).toBe(false)
  })

  it('hole survives a normalize→rescale coordinate round-trip (seam dup vertices)', () => {
    // scaling by 1/100 then 140 perturbs the geometry by fp noise; the arc-seam duplicate
    // vertices then made earcut eat half the hole. Dedup before earcut keeps it intact.
    const p = new Path2D().addData(DONUT)
    p.style.fillRule = 'evenodd'
    p.curves.forEach(c => c.applyTransform(new Transform2D().scale(1 / 100, 1 / 100)))
    p.curves.forEach(c => c.applyTransform(new Transform2D().scale(140, 140)))
    const r = p.fillTriangulate()
    const c = 70 // centre after ×1.4 scale
    expect(r.vertices.every(Number.isFinite)).toBe(true)
    // the whole inner disk (r < ~28) must be empty, all around — not just on one side
    for (const [dx, dy] of [[0, 0], [15, 0], [-15, 0], [0, 15], [0, -15], [10, 10], [-10, -10]]) {
      expect(covered(r, c + dx, c + dy)).toBe(false)
    }
    expect(covered(r, c, c + 48)).toBe(true) // ring band still filled
  })

  it('nested donut (island in the hole) fills the island under evenodd', () => {
    // outer ring r40, hole r28, solid island r12 — all concentric at (50,50)
    const p = new Path2D()
    p.arc(50, 50, 40, 0, Math.PI * 2)
    p.moveTo(78, 50)
    p.arc(50, 50, 28, 0, Math.PI * 2)
    p.moveTo(62, 50)
    p.arc(50, 50, 12, 0, Math.PI * 2)
    p.style.fillRule = 'evenodd'
    const r = p.fillTriangulate()
    // radii from center (50,50): island ≤12, hole 12..28, band 28..40, outside >40
    expect(covered(r, 50, 50)).toBe(true) // r0 — island (depth 2) filled
    expect(covered(r, 50, 70)).toBe(false) // r20 — hole (depth 1)
    expect(covered(r, 50, 16)).toBe(true) // r34 — outer band (depth 0)
    expect(covered(r, 50, 4)).toBe(false) // r46 — outside the outer ring
  })
})
