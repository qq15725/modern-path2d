import { Vector2 } from '../math'

export function toKebabCase(str: string): string {
  return str
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/\B([A-Z])/g, '-$1')
    .toLowerCase()
}

export function getIntersectionPoint(p1: Vector2, p2: Vector2, q1: Vector2, q2: Vector2): Vector2 {
  const r = p2.clone().sub(p1)
  const s = q2.clone().sub(q1)
  const q1p1 = q1.clone().sub(p1)

  const crossRS = r.cross(s)
  if (crossRS === 0) {
    // TODO 优化点
    return new Vector2(
      (p1.x + q1.x) / 2,
      (p1.y + q1.y) / 2,
    )
  }

  const t = q1p1.cross(s) / crossRS

  if (Math.abs(t) > 1) {
    // TODO 优化点
    return new Vector2(
      (p1.x + q1.x) / 2,
      (p1.y + q1.y) / 2,
    )
  }

  return new Vector2(
    p1.x + t * r.x,
    p1.y + t * r.y,
  )
}
