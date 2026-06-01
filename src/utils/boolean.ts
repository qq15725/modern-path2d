import type { MultiPolygon, Pair } from 'polygon-clipping'
// The package's ESM build exposes only a default object `{ union, intersection, xor, difference }`.
import polygonClipping from 'polygon-clipping'

export type BooleanOp = 'union' | 'intersection' | 'difference' | 'xor'

/**
 * A flat ring: `[x0, y0, x1, y1, …]` (the same layout {@link Curve.getAdaptiveVertices} produces).
 * A path is described as an array of such rings (one per sub-path).
 */
export type FlatRing = number[]

function flatRingToPairs(r: FlatRing): Pair[] {
  const ring: Pair[] = []
  for (let i = 0; i < r.length; i += 2) {
    ring.push([r[i], r[i + 1]])
  }
  // polygon-clipping wants explicitly-closed rings.
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push([first[0], first[1]])
  }
  return ring
}

/**
 * Interpret a ring soup as a single filled region. Multiple rings are combined with the even-odd
 * rule (XOR), which turns nested rings into holes — matching how a multi-sub-path shape (e.g. a
 * donut) fills. For non-self-overlapping shapes this coincides with the nonzero rule.
 */
function ringsToGeom(rings: FlatRing[]): MultiPolygon {
  const valid = rings.filter(r => r.length >= 6).map(flatRingToPairs)
  if (!valid.length) {
    return []
  }
  let geom: MultiPolygon = [[valid[0]]]
  for (let i = 1; i < valid.length; i++) {
    geom = polygonClipping.xor(geom, [[valid[i]]])
  }
  return geom
}

function geomToRings(geom: MultiPolygon): FlatRing[] {
  const out: FlatRing[] = []
  for (const poly of geom) {
    for (const ring of poly) {
      const flat: FlatRing = []
      for (const [x, y] of ring) {
        flat.push(x, y)
      }
      out.push(flat)
    }
  }
  return out
}

/**
 * Boolean operation between two ring soups, returning the result as flat rings (shells wound
 * counter-clockwise, holes clockwise — so a nonzero fill renders them correctly). Powered by the
 * Martinez–Rueda sweep-line clipper (`polygon-clipping`); because the inputs are sampled outlines,
 * the result is a polygonal approximation of curved paths.
 */
export function polygonBoolean(op: BooleanOp, ringsA: FlatRing[], ringsB: FlatRing[]): FlatRing[] {
  const a = ringsToGeom(ringsA)
  const b = ringsToGeom(ringsB)
  let res: MultiPolygon
  switch (op) {
    case 'union':
      res = polygonClipping.union(a, b)
      break
    case 'intersection':
      res = polygonClipping.intersection(a, b)
      break
    case 'difference':
      res = polygonClipping.difference(a, b)
      break
    case 'xor':
      res = polygonClipping.xor(a, b)
      break
  }
  return geomToRings(res)
}
