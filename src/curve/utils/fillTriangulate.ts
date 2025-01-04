import earcut from 'earcut'

export interface FillTriangulateOptions {
  holes?: number[]
  verticesStride?: number
  verticesOffset?: number
  indicesOffset?: number
}

export function fillTriangulate(
  points: number[],
  vertices: number[],
  indices: number[],
  options: FillTriangulateOptions = {},
): void {
  let {
    holes = [],
    verticesStride = 2,
    verticesOffset = 0,
    indicesOffset = 0,
  } = options

  const triangles = earcut(points, holes, 2)

  if (triangles) {
    for (let i = 0; i < triangles.length; i += 3) {
      indices[indicesOffset++] = (triangles[i] + verticesOffset)
      indices[indicesOffset++] = (triangles[i + 1] + verticesOffset)
      indices[indicesOffset++] = (triangles[i + 2] + verticesOffset)
    }
    let index = verticesOffset * verticesStride
    for (let i = 0; i < points.length; i += 2) {
      vertices[index] = points[i]
      vertices[index + 1] = points[i + 1]
      index += verticesStride
    }
  }
}
