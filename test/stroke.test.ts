import { describe, expect, it } from 'vitest'
import { Path2D, PathMeasure } from '../src/index'
import { resolveLineStyle, strokeTriangulate } from '../src/utils'

function inTriangle(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): boolean {
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
  const a = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d
  const b = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d
  const c = 1 - a - b
  return a >= -1e-6 && b >= -1e-6 && c >= -1e-6
}

/** Number of points on the circle of radius `rad` (centered cx,cy) NOT covered by any triangle. */
function uncoveredOnRing(
  result: { vertices: number[], indices: number[] },
  cx: number,
  cy: number,
  rad: number,
  step = 0.5,
): number {
  const { vertices: V, indices: I } = result
  let bad = 0
  for (let deg = 0; deg < 360; deg += step) {
    const a = (deg * Math.PI) / 180
    const px = cx + rad * Math.cos(a)
    const py = cy + rad * Math.sin(a)
    let ok = false
    for (let i = 0; i < I.length; i += 3) {
      const x = I[i]
      const y = I[i + 1]
      const z = I[i + 2]
      if (inTriangle(px, py, V[x * 2], V[x * 2 + 1], V[y * 2], V[y * 2 + 1], V[z * 2], V[z * 2 + 1])) {
        ok = true
        break
      }
    }
    if (!ok)
      bad++
  }
  return bad
}

describe('stroke triangulation', () => {
  it('honors style.strokeWidth instead of a 1px hairline', () => {
    const p = new Path2D()
    p.arc(100, 100, 50, 0, Math.PI * 2, true)
    p.style.stroke = 'black'
    p.style.strokeWidth = 20
    const r = p.strokeTriangulate()
    // width 20 centered on r=50 → covers r∈[40,60]
    expect(uncoveredOnRing(r, 100, 100, 43)).toBe(0)
    expect(uncoveredOnRing(r, 100, 100, 57)).toBe(0)
    // outside the band → not covered
    expect(uncoveredOnRing(r, 100, 100, 70)).toBeGreaterThan(700)
  })

  it('leaves no seam gap on a full circle (closed inferred)', () => {
    const p = new Path2D()
    p.arc(100, 100, 50, 0, Math.PI * 2, true)
    p.style.strokeWidth = 8
    expect(p.curves[0].isClosed()).toBe(true)
    expect(uncoveredOnRing(p.strokeTriangulate(), 100, 100, 50)).toBe(0)
  })

  it('infers closed-ness per shape', () => {
    const circle = new Path2D()
    circle.arc(100, 100, 50, 0, Math.PI * 2, true)
    expect(circle.curves[0].isClosed()).toBe(true)

    const semi = new Path2D()
    semi.arc(100, 100, 50, 0, Math.PI, false)
    expect(semi.curves[0].isClosed()).toBe(false)

    const rect = new Path2D()
    rect.rect(10, 10, 80, 80)
    expect(rect.curves[0].isClosed()).toBe(true)

    const open = new Path2D()
    open.moveTo(0, 0)
    open.lineTo(50, 0)
    open.lineTo(50, 50)
    expect(open.curves[0].isClosed()).toBe(false)
  })

  it('no seam spikes on a two-arc circle (duplicate vertices collapsed)', () => {
    // SVG circle built from two semicircle arcs + Z — the arc seam and closing line leave
    // coincident vertices that previously produced zero-length segments → NaN spikes.
    const p = new Path2D().addData('M0 50 A50 50 0 1 0 100 50 A50 50 0 1 0 0 50 Z')
    p.style.strokeWidth = 4
    const r = p.strokeTriangulate()
    expect(r.vertices.every(Number.isFinite)).toBe(true)
    // the stroke band hugs r=50: centerline fully covered, nothing at the center or far outside
    expect(uncoveredOnRing(r, 50, 50, 50)).toBe(0)
    expect(uncoveredOnRing(r, 50, 50, 0.0001)).toBeGreaterThan(700) // center is empty
  })

  it('strokeTriangulate tolerates duplicate input points without NaN', () => {
    const pts = [0, 0, 10, 0, 10, 0, 10, 10, 10, 10, 0, 10, 0, 0]
    const r = strokeTriangulate(pts, {
      lineStyle: { width: 2, alignment: 0.5, join: 'miter', cap: 'butt', miterLimit: 10 },
    })
    expect(r.vertices.length).toBeGreaterThan(0)
    expect(r.vertices.every(Number.isFinite)).toBe(true)
  })

  it('resolveLineStyle maps Path2DStyle onto LineStyle', () => {
    expect(resolveLineStyle({ strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'square' }))
      .toMatchObject({ width: 4, join: 'round', cap: 'square' })
    // arcs / miter-clip degrade to miter; undefined width → 1
    expect(resolveLineStyle({ strokeLinejoin: 'arcs' })).toMatchObject({ width: 1, join: 'miter' })
    expect(resolveLineStyle(undefined)).toMatchObject({ width: 1, join: 'miter', cap: 'butt' })
  })

  it('alignment shifts the stroke inside/outside consistently for CW and CCW', () => {
    // Covered radial extent (along 45°) for a circle of radius 50, stroke width 10.
    const bandCenter = (cw: boolean, alignment: number): number => {
      const p = new Path2D()
      p.arc(100, 100, 50, 0, Math.PI * 2, cw)
      const r = strokeTriangulate(p.curves[0].getAdaptiveVertices(), {
        lineStyle: { width: 10, alignment, join: 'miter', cap: 'butt', miterLimit: 10 },
      })
      const a = Math.PI / 4
      let lo = Infinity
      let hi = -Infinity
      for (let rad = 20; rad <= 80; rad += 0.1) {
        const px = 100 + rad * Math.cos(a)
        const py = 100 + rad * Math.sin(a)
        const { vertices: V, indices: I } = r
        for (let i = 0; i < I.length; i += 3) {
          const x = I[i]
          const y = I[i + 1]
          const z = I[i + 2]
          if (inTriangle(px, py, V[x * 2], V[x * 2 + 1], V[y * 2], V[y * 2 + 1], V[z * 2], V[z * 2 + 1])) {
            lo = Math.min(lo, rad)
            hi = Math.max(hi, rad)
            break
          }
        }
      }
      return (lo + hi) / 2
    }
    for (const cw of [false, true]) {
      expect(bandCenter(cw, 0)).toBeCloseTo(55, 0) // outer
      expect(bandCenter(cw, 0.5)).toBeCloseTo(50, 0) // centered
      expect(bandCenter(cw, 1)).toBeCloseTo(45, 0) // inner
    }
  })

  it('emits one arc-length uv per vertex when uvs is passed', () => {
    // open polyline with a 90° corner (exercises the join branch) + bezier curve
    const p = new Path2D()
    p.moveTo(0, 0)
    p.lineTo(100, 0)
    p.lineTo(100, 100)
    p.bezierCurveTo(100, 200, 200, 200, 200, 100)
    const vertices: number[] = []
    const indices: number[] = []
    const uvs: number[] = []
    p.strokeTriangulate({
      vertices,
      indices,
      uvs,
      lineStyle: { width: 10, alignment: 0.5, join: 'round', cap: 'round', miterLimit: 10 },
      closed: false,
    })
    // one uv pair per vertex pair
    expect(uvs.length).toBe(vertices.length)
    // u is cumulative arc length in path units (0 at the start, ≈ total length
    // at the end); v is 0/1 at the boundaries and 0.5 on round join/cap fan
    // centers (centerline)
    let minU = Infinity
    let maxU = -Infinity
    let centerlineCount = 0
    for (let i = 0; i < uvs.length; i += 2) {
      minU = Math.min(minU, uvs[i])
      maxU = Math.max(maxU, uvs[i])
      const v = uvs[i + 1]
      expect(v === 0 || v === 0.5 || v === 1).toBe(true)
      if (v === 0.5)
        centerlineCount++
    }
    // round joins/caps in this path must have produced centerline fan vertices
    expect(centerlineCount).toBeGreaterThan(0)
    const m = new PathMeasure(p)
    const total = m.getLength()
    expect(minU).toBe(0)
    expect(maxU).toBeCloseTo(total, 0)
    // u is non-decreasing along the vertex strip (per side)
    for (let i = 4; i < uvs.length; i += 2) {
      expect(uvs[i]).toBeGreaterThanOrEqual(uvs[i - 4] - 1e-9)
    }
    // the corner at (100,0) sits 100 units along the path: vertices near it
    // must carry u ≈ 100
    for (let i = 0; i < vertices.length; i += 2) {
      if (Math.abs(vertices[i] - 100) < 6 && Math.abs(vertices[i + 1]) < 6) {
        expect(uvs[i]).toBeCloseTo(100, 0)
      }
    }
  })

  it('omitting uvs changes nothing', () => {
    const p = new Path2D()
    p.moveTo(0, 0)
    p.lineTo(100, 50)
    const a = p.strokeTriangulate({ lineStyle: { width: 4, alignment: 0.5, join: 'miter', cap: 'butt', miterLimit: 10 } })
    expect(a.uvs).toBeUndefined()
    expect(a.vertices.length).toBeGreaterThan(0)
  })

  it('explicit lineStyle still wins over derived style', () => {
    const p = new Path2D()
    p.arc(100, 100, 50, 0, Math.PI * 2, true)
    const verts = p.curves[0].getAdaptiveVertices()
    const r = strokeTriangulate(verts, {
      style: { strokeWidth: 50 },
      lineStyle: { width: 2, alignment: 0.5, join: 'miter', cap: 'butt', miterLimit: 10 },
    })
    // explicit width 2 used → r=70 far outside
    expect(uncoveredOnRing(r, 100, 100, 70)).toBeGreaterThan(700)
  })
})

describe('PathMeasure', () => {
  it('measures a circle', () => {
    const p = new Path2D()
    p.arc(100, 100, 50, 0, Math.PI * 2, true)
    const m = new PathMeasure(p)
    expect(m.getLength()).toBeCloseTo(2 * Math.PI * 50, 0)
    expect(m.isClosed()).toBe(true)
    // quarter way around lands at the top of the circle
    const q = m.getPosTanAtProgress(0.25)
    expect(q.position.x).toBeCloseTo(100, 0)
    expect(q.position.y).toBeCloseTo(50, 0)
  })

  it('getPosTan clamps distance and reports tangent angle on a line', () => {
    const l = new Path2D()
    l.moveTo(0, 0)
    l.lineTo(100, 0)
    const m = new PathMeasure(l)
    expect(m.getLength()).toBeCloseTo(100, 5)
    expect(m.getPosition(50).x).toBeCloseTo(50, 5)
    expect(m.getPosTan(50).angle).toBeCloseTo(0, 5)
    // clamps past the end
    expect(m.getPosition(1000).x).toBeCloseTo(100, 5)
    expect(m.sample(8)).toHaveLength(9)
  })
})
