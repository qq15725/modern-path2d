import { pointInPolygon } from './pointInPolygon'

export interface EvenoddFillRuleResult {
  index: number
  /** Containment depth: 0/2/4… are filled shells, 1/3/5… are holes. */
  depth: number
  /** Immediate enclosing ring (deepest container), or -1 for a top-level ring. */
  parentIndex: number
}

interface Aabb {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function boundsOf(ring: number[]): Aabb | null {
  if (ring.length < 6) {
    return null
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i < ring.length; i += 2) {
    const x = ring[i]
    const y = ring[i + 1]
    if (x < minX)
      minX = x
    if (y < minY)
      minY = y
    if (x > maxX)
      maxX = x
    if (y > maxY)
      maxY = y
  }
  return { minX, minY, maxX, maxY }
}

function bboxInside(inner: Aabb, outer: Aabb): boolean {
  return inner.minX >= outer.minX && inner.maxX <= outer.maxX
    && inner.minY >= outer.minY && inner.maxY <= outer.maxY
}

/** Whether ring `inner` lies inside ring `outer`, by majority vote over sampled vertices. */
function ringInsideRing(inner: number[], outer: number[]): boolean {
  const n = inner.length / 2
  const step = Math.max(1, Math.floor(n / 9))
  let tested = 0
  let inside = 0
  for (let i = 0; i < n; i += step) {
    tested++
    if (pointInPolygon({ x: inner[i * 2], y: inner[i * 2 + 1] }, outer, 'evenodd')) {
      inside++
    }
  }
  return tested > 0 && inside * 2 > tested
}

/**
 * Even-odd nesting of a ring soup: classify each ring by how many other rings contain it.
 * Even depth → a filled shell; odd depth → a hole. Each ring also gets its immediate parent
 * (the deepest container), so a shell can collect exactly the holes one level inside it — and
 * an island inside a hole becomes its own shell again (nested donuts work).
 *
 * Mirrors {@link nonzeroFillRule}'s output shape, but uses containment parity (even-odd) instead
 * of winding. Used by `Path2D.fillTriangulate` for `fillRule: 'evenodd'` so WebGL/triangulated
 * fills get real holes instead of solid overlapping rings.
 */
export function evenoddFillRule(paths: number[][]): EvenoddFillRuleResult[] {
  const len = paths.length
  const bboxes = paths.map(boundsOf)
  const depth: number[] = Array.from<number>({ length: len }).fill(0)
  const containers: number[][] = paths.map(() => [])

  for (let i = 0; i < len; i++) {
    const bi = bboxes[i]
    if (!bi) {
      continue
    }
    for (let j = 0; j < len; j++) {
      if (i === j) {
        continue
      }
      const bj = bboxes[j]
      // ring i can only sit inside ring j when its bounds do.
      if (!bj || !bboxInside(bi, bj)) {
        continue
      }
      if (ringInsideRing(paths[i], paths[j])) {
        depth[i]++
        containers[i].push(j)
      }
    }
  }

  return paths.map((_, i) => {
    let parentIndex = -1
    let bestDepth = -1
    for (const j of containers[i]) {
      if (depth[j] > bestDepth) {
        bestDepth = depth[j]
        parentIndex = j
      }
    }
    return { index: i, depth: depth[i], parentIndex }
  })
}
