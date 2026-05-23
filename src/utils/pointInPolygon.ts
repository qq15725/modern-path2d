import type { Vector2Like } from '../math'
import type { FillRule } from '../types'

/**
 * Signed pseudo-cross product used to classify which side of edge a→b a point lies on.
 * > 0: point is to the left of a→b, < 0: to the right, 0: on the line.
 */
function isLeft(ax: number, ay: number, bx: number, by: number, px: number, py: number): number {
  return (bx - ax) * (py - ay) - (px - ax) * (by - ay)
}

/**
 * Winding number of a point with respect to a single ring (nonzero rule).
 * `vertices` is a flat `[x0, y0, x1, y1, ...]` array and is treated as implicitly closed.
 */
function windingNumber(px: number, py: number, vertices: number[]): number {
  const len = vertices.length
  let wn = 0
  for (let i = 0; i < len; i += 2) {
    const ax = vertices[i]
    const ay = vertices[i + 1]
    const k = (i + 2) % len
    const bx = vertices[k]
    const by = vertices[k + 1]
    if (ay <= py) {
      // upward crossing
      if (by > py && isLeft(ax, ay, bx, by, px, py) > 0) {
        wn++
      }
    }
    else {
      // downward crossing
      if (by <= py && isLeft(ax, ay, bx, by, px, py) < 0) {
        wn--
      }
    }
  }
  return wn
}

/**
 * Number of times a horizontal ray from the point crosses a single ring (even-odd rule).
 * `vertices` is a flat `[x0, y0, x1, y1, ...]` array and is treated as implicitly closed.
 */
function crossingNumber(px: number, py: number, vertices: number[]): number {
  const len = vertices.length
  let cn = 0
  for (let i = 0; i < len; i += 2) {
    const ax = vertices[i]
    const ay = vertices[i + 1]
    const k = (i + 2) % len
    const bx = vertices[k]
    const by = vertices[k + 1]
    if ((ay <= py && by > py) || (ay > py && by <= py)) {
      const t = (py - ay) / (by - ay)
      if (px < ax + t * (bx - ax)) {
        cn++
      }
    }
  }
  return cn
}

/**
 * Distance from a point to a single segment a→b (raw numeric core, no allocation).
 */
function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq
  if (t < 0) {
    t = 0
  }
  else if (t > 1) {
    t = 1
  }
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

/**
 * Test whether a point lies inside a single polygon ring.
 *
 * `vertices` is a flat `[x0, y0, x1, y1, ...]` array and is treated as implicitly closed
 * (the last vertex connects back to the first). A ring with fewer than 3 points has no
 * area and always returns `false`.
 *
 * @param point The point to test.
 * @param vertices Flat vertex array of the ring.
 * @param fillRule `'nonzero'` (default, matches SVG/Canvas) or `'evenodd'`.
 */
export function pointInPolygon(
  point: Vector2Like,
  vertices: number[],
  fillRule: FillRule = 'nonzero',
): boolean {
  if (vertices.length < 6) {
    return false
  }
  if (fillRule === 'evenodd') {
    return (crossingNumber(point.x, point.y, vertices) & 1) === 1
  }
  return windingNumber(point.x, point.y, vertices) !== 0
}

/**
 * Test whether a point lies inside a shape composed of multiple rings (sub-paths).
 *
 * This is the multi-ring counterpart of {@link pointInPolygon} and is what donut /
 * hollow shapes need: every ring is evaluated together so holes are honored.
 * - `'nonzero'`: sum the signed winding numbers of all rings, inside if the total ≠ 0.
 * - `'evenodd'`: sum the ray-crossing counts of all rings, inside if the total is odd.
 *
 * @param point The point to test.
 * @param polygons Array of flat vertex arrays, one per ring.
 * @param fillRule `'nonzero'` (default) or `'evenodd'`.
 */
export function pointInPolygons(
  point: Vector2Like,
  polygons: number[][],
  fillRule: FillRule = 'nonzero',
): boolean {
  const { x, y } = point
  if (fillRule === 'evenodd') {
    let cn = 0
    for (let i = 0, len = polygons.length; i < len; i++) {
      const ring = polygons[i]
      if (ring.length >= 6) {
        cn += crossingNumber(x, y, ring)
      }
    }
    return (cn & 1) === 1
  }
  let wn = 0
  for (let i = 0, len = polygons.length; i < len; i++) {
    const ring = polygons[i]
    if (ring.length >= 6) {
      wn += windingNumber(x, y, ring)
    }
  }
  return wn !== 0
}

/**
 * Shortest distance from a point to a single line segment a→b.
 */
export function pointToSegmentDistance(point: Vector2Like, a: Vector2Like, b: Vector2Like): number {
  return segmentDistance(point.x, point.y, a.x, a.y, b.x, b.y)
}

/**
 * Shortest distance from a point to a polyline.
 *
 * @param point The point to test.
 * @param vertices Flat `[x0, y0, x1, y1, ...]` array of the polyline.
 * @param closed When `true`, also considers the closing edge from the last vertex back
 *   to the first (use for closed paths, e.g. `z`/`Z` or `CurvePath.autoClose`).
 */
export function pointToPolylineDistance(
  point: Vector2Like,
  vertices: number[],
  closed = false,
): number {
  const len = vertices.length
  if (len < 2) {
    return Infinity
  }
  const { x: px, y: py } = point
  if (len === 2) {
    return Math.hypot(px - vertices[0], py - vertices[1])
  }
  let min = Infinity
  for (let i = 0; i < len - 2; i += 2) {
    const d = segmentDistance(px, py, vertices[i], vertices[i + 1], vertices[i + 2], vertices[i + 3])
    if (d < min) {
      min = d
    }
  }
  if (closed && len >= 6) {
    const d = segmentDistance(px, py, vertices[len - 2], vertices[len - 1], vertices[0], vertices[1])
    if (d < min) {
      min = d
    }
  }
  return min
}
