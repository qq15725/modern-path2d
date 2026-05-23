import { Vector2 } from '../math'

export const PI = Math.PI
export const PI_2 = PI * 2

export function toKebabCase(str: string): string {
  return str
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/\B([A-Z])/g, '-$1')
    .toLowerCase()
}

/**
 * Intersection of line p1→p2 with line q1→q2, or `null` when the segments are parallel
 * (`crossRS === 0`) or the intersection lies too far off p1→p2 (`|t| > 1`). Callers must
 * handle `null` (e.g. `Path2D.bold` skips the join when there is no usable point).
 */
export function getIntersectionPoint(p1: Vector2, p2: Vector2, q1: Vector2, q2: Vector2): Vector2 | null {
  const r = p2.clone().sub(p1)
  const s = q2.clone().sub(q1)
  const q1p1 = q1.clone().sub(p1)

  const crossRS = r.cross(s)
  if (crossRS === 0) {
    // Parallel / collinear: no single intersection point.
    return null
  }

  const t = q1p1.cross(s) / crossRS

  if (Math.abs(t) > 1) {
    // Intersection is too far beyond the p1→p2 span to be a sensible join.
    return null
  }

  return new Vector2(
    p1.x + t * r.x,
    p1.y + t * r.y,
  )
}
