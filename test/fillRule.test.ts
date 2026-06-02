import { describe, expect, it } from 'vitest'
import { Path2D } from '../src/index'

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
