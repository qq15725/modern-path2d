import type { Path2DStyle } from '../../core'
import earcut from 'earcut'

export interface FillTriangulateOptions {
  holes?: number[]
  vertices?: number[]
  indices?: number[]
  verticesStride?: number
  verticesOffset?: number
  indicesOffset?: number
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
