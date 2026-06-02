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
