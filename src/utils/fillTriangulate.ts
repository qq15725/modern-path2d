import type { FillRule, Path2DStyle } from '../types'
import earcut from 'earcut'

export interface FillTriangulateOptions {
  holes?: number[]
  vertices?: number[]
  indices?: number[]
  verticesStride?: number
  verticesOffset?: number
  indicesOffset?: number
  /**
   * Fill rule for multi-sub-path grouping in `Path2D.fillTriangulate`. Takes precedence over
   * `style.fillRule`. Ignored by the low-level single-ring `fillTriangulate()` function.
   */
  fillRule?: FillRule
  style?: Partial<Path2DStyle>
}

export interface FillTriangulatedResult {
  vertices: number[]
  indices: number[]
}

const fillDedupeEps = 1e-7

/**
 * Drop consecutive (and ring-closing) coincident points per contour, remapping the hole indices.
 * Sub-curve seams (two arcs meeting, a degenerate closing line) leave duplicate vertices; the
 * resulting zero-length edges make earcut produce overlapping triangles that eat into holes —
 * especially after a coordinate round-trip perturbs the geometry just enough to trip it.
 */
function dedupeContours(
  points: number[],
  holeIndices: number[],
  eps: number,
): { points: number[], holes: number[] } {
  const total = points.length / 2
  const bounds = [0, ...holeIndices, total]
  const out: number[] = []
  const newHoles: number[] = []
  for (let s = 0; s < bounds.length - 1; s++) {
    const start = bounds[s]
    const end = bounds[s + 1]
    if (s > 0) {
      newHoles.push(out.length / 2)
    }
    const segStart = out.length
    for (let vi = start; vi < end; vi++) {
      const x = points[vi * 2]
      const y = points[vi * 2 + 1]
      const m = out.length
      if (m > segStart && Math.abs(x - out[m - 2]) < eps && Math.abs(y - out[m - 1]) < eps) {
        continue
      }
      out.push(x, y)
    }
    // drop a trailing point coincident with the contour's first (zero-length closing edge)
    if (out.length - segStart >= 4
      && Math.abs(out[out.length - 2] - out[segStart]) < eps
      && Math.abs(out[out.length - 1] - out[segStart + 1]) < eps) {
      out.length -= 2
    }
  }
  return { points: out, holes: newHoles }
}

export function fillTriangulate(
  pointArray: number[],
  options: FillTriangulateOptions = {},
): FillTriangulatedResult {
  let {
    vertices = [],
    indices = [],
    holes = [],
    verticesStride = 2,
    verticesOffset = vertices.length / verticesStride,
    indicesOffset = indices.length,
  } = options

  ;({ points: pointArray, holes } = dedupeContours(pointArray, holes, fillDedupeEps))

  const triangles = earcut(pointArray, holes, 2)

  if (triangles.length) {
    for (let i = 0; i < triangles.length; i += 3) {
      indices[indicesOffset++] = (triangles[i] + verticesOffset)
      indices[indicesOffset++] = (triangles[i + 1] + verticesOffset)
      indices[indicesOffset++] = (triangles[i + 2] + verticesOffset)
    }
    let index = verticesOffset * verticesStride
    for (let i = 0; i < pointArray.length; i += 2) {
      vertices[index] = pointArray[i]
      vertices[index + 1] = pointArray[i + 1]
      index += verticesStride
    }
  }

  return {
    vertices,
    indices,
  }
}
