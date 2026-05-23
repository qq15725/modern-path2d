import type { Path2DStyle } from '../src/index'
import { describe, expect, it } from 'vitest'
import {
  CurvePath,
  Path2D,
  Path2DSet,
  pointInPolygon,
  pointInPolygons,
  pointToPolylineDistance,
  pointToSegmentDistance,
} from '../src/index'

describe('pointInPolygon', () => {
  const square = [0, 0, 100, 0, 100, 100, 0, 100]

  it('detects inside / outside (nonzero)', () => {
    expect(pointInPolygon({ x: 50, y: 50 }, square)).toBe(true)
    expect(pointInPolygon({ x: 150, y: 50 }, square)).toBe(false)
    expect(pointInPolygon({ x: -1, y: -1 }, square)).toBe(false)
  })

  it('detects inside / outside (evenodd)', () => {
    expect(pointInPolygon({ x: 50, y: 50 }, square, 'evenodd')).toBe(true)
    expect(pointInPolygon({ x: 150, y: 50 }, square, 'evenodd')).toBe(false)
  })

  it('returns false for degenerate rings', () => {
    expect(pointInPolygon({ x: 0, y: 0 }, [0, 0, 1, 1])).toBe(false)
    expect(pointInPolygon({ x: 0, y: 0 }, [])).toBe(false)
  })
})

describe('pointInPolygons (holes)', () => {
  const outer = [0, 0, 100, 0, 100, 100, 0, 100] // CW
  const innerOpposite = [25, 25, 25, 75, 75, 75, 75, 25] // CCW (opposite winding)
  const innerSame = [25, 25, 75, 25, 75, 75, 25, 75] // CW (same winding)

  it('nonzero: punches a hole when the inner ring winds the opposite way', () => {
    expect(pointInPolygons({ x: 50, y: 50 }, [outer, innerOpposite], 'nonzero')).toBe(false)
    expect(pointInPolygons({ x: 10, y: 10 }, [outer, innerOpposite], 'nonzero')).toBe(true)
  })

  it('nonzero: no hole when the inner ring winds the same way', () => {
    expect(pointInPolygons({ x: 50, y: 50 }, [outer, innerSame], 'nonzero')).toBe(true)
  })

  it('evenodd: nested rings always punch a hole regardless of direction', () => {
    expect(pointInPolygons({ x: 50, y: 50 }, [outer, innerSame], 'evenodd')).toBe(false)
    expect(pointInPolygons({ x: 10, y: 10 }, [outer, innerSame], 'evenodd')).toBe(true)
  })
})

describe('point distance', () => {
  it('pointToSegmentDistance projects and clamps to the segment', () => {
    expect(pointToSegmentDistance({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5)
    // beyond the end of the segment -> clamps to the endpoint
    expect(pointToSegmentDistance({ x: 20, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10)
  })

  it('pointToPolylineDistance honors the closed flag', () => {
    const poly = [0, 0, 10, 0, 10, 10]
    expect(pointToPolylineDistance({ x: 5, y: 2 }, poly)).toBe(2)
    const open = pointToPolylineDistance({ x: 2, y: 8 }, poly, false)
    const closed = pointToPolylineDistance({ x: 2, y: 8 }, poly, true)
    expect(closed).toBeLessThan(open)
  })
})

describe('curve.isPointInFill', () => {
  it('CurvePath treats its segments as a single ring', () => {
    const cp = new CurvePath()
    cp.moveTo(0, 0).lineTo(100, 0).lineTo(100, 100).lineTo(0, 100).closePath()
    expect(cp.isPointInFill({ x: 50, y: 50 })).toBe(true)
    expect(cp.isPointInFill({ x: 150, y: 50 })).toBe(false)
  })

  it('contains(x, y) is the concise PathKit-style alias', () => {
    const cp = new CurvePath()
    cp.moveTo(0, 0).lineTo(100, 0).lineTo(100, 100).lineTo(0, 100).closePath()
    expect(cp.contains(50, 50)).toBe(true)
    expect(cp.contains(150, 50)).toBe(false)
  })
})

describe('Path2D hit testing', () => {
  function donut(): Path2D {
    const p = new Path2D()
    // outer ring (CW)
    p.moveTo(0, 0).lineTo(100, 0).lineTo(100, 100).lineTo(0, 100).closePath()
    // inner ring (CCW) -> hole under the nonzero rule
    p.moveTo(25, 25).lineTo(25, 75).lineTo(75, 75).lineTo(75, 25).closePath()
    return p
  }

  it('isPointInFill honors holes across sub-paths', () => {
    const p = donut()
    expect(p.isPointInFill({ x: 10, y: 10 })).toBe(true) // ring material
    expect(p.isPointInFill({ x: 50, y: 50 })).toBe(false) // inside the hole
    expect(p.isPointInFill({ x: 200, y: 200 })).toBe(false) // outside everything
  })

  it('isPointInStroke uses the path strokeWidth and tolerance', () => {
    const p = new Path2D(undefined, { stroke: '#000', strokeWidth: 10 })
    p.moveTo(0, 0).lineTo(100, 0)
    expect(p.isPointInStroke({ x: 50, y: 4 })).toBe(true) // within half-width
    expect(p.isPointInStroke({ x: 50, y: 6 })).toBe(false) // outside half-width
    expect(p.isPointInStroke({ x: 50, y: 6 }, { tolerance: 2 })).toBe(true) // tolerance rescues it
  })
})

describe('Path2DSet', () => {
  function box(x: number, y: number, w: number, h: number, style: Partial<Path2DStyle>): Path2D {
    const p = new Path2D(undefined, style)
    p.moveTo(x, y).lineTo(x + w, y).lineTo(x + w, y + h).lineTo(x, y + h).closePath()
    return p
  }

  it('isPointInFill is true when any path contains the point', () => {
    const set = new Path2DSet([box(0, 0, 100, 100, {})])
    expect(set.isPointInFill({ x: 50, y: 50 })).toBe(true)
    expect(set.isPointInFill({ x: 150, y: 50 })).toBe(false)
  })

  it('hitTest returns the topmost path', () => {
    const bottom = box(0, 0, 100, 100, { fill: '#f00' })
    const top = box(40, 40, 100, 100, { fill: '#00f' })
    const set = new Path2DSet([bottom, top])
    expect(set.hitTest({ x: 60, y: 60 })).toBe(top) // overlap -> topmost wins
    expect(set.hitTest({ x: 10, y: 10 })).toBe(bottom)
    expect(set.hitTest({ x: 200, y: 200 })).toBeUndefined()
  })

  it('hitTest skips fill:none and falls back to the stroke', () => {
    const p = box(0, 0, 100, 100, { fill: 'none', stroke: '#000', strokeWidth: 10 })
    const set = new Path2DSet([p])
    expect(set.hitTest({ x: 50, y: 50 })).toBeUndefined() // interior, no fill -> miss
    expect(set.hitTest({ x: 0, y: 50 })).toBe(p) // on the edge stroke -> hit
  })
})
