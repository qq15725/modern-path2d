import type { FillTriangulateOptions, FillTriangulateResult } from './utils'
import { Vector2 } from '../math'
import { LineCurve } from './LineCurve'
import { PloygonCurve } from './PloygonCurve'

export class RectangleCurve extends PloygonCurve {
  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0,
  ) {
    const points = [
      new Vector2(x, y),
      new Vector2(x + width, y),
      new Vector2(x + width, y + height),
      new Vector2(x, y + height),
    ]

    super([
      LineCurve.from(points[0], points[1]),
      LineCurve.from(points[1], points[2]),
      LineCurve.from(points[2], points[3]),
      LineCurve.from(points[3], points[0]),
    ])
  }

  override fillTriangulate(options: FillTriangulateOptions = {}): FillTriangulateResult {
    let {
      vertices = [],
      indices = [],
      verticesStride = 2,
      verticesOffset = 0,
      indicesOffset = 0,
    } = options

    const { x, y, width, height } = this

    const points = [
      x, y,
      x + width, y,
      x + width, y + height,
      x, y + height,
    ]

    let count = 0
    verticesOffset *= verticesStride
    vertices[verticesOffset + count] = points[0]
    vertices[verticesOffset + count + 1] = points[1]
    count += verticesStride
    vertices[verticesOffset + count] = points[2]
    vertices[verticesOffset + count + 1] = points[3]
    count += verticesStride
    vertices[verticesOffset + count] = points[6]
    vertices[verticesOffset + count + 1] = points[7]
    count += verticesStride
    vertices[verticesOffset + count] = points[4]
    vertices[verticesOffset + count + 1] = points[5]
    count += verticesStride
    const verticesIndex = verticesOffset / verticesStride
    // triangle 1
    indices[indicesOffset++] = verticesIndex
    indices[indicesOffset++] = verticesIndex + 1
    indices[indicesOffset++] = verticesIndex + 2
    // triangle 2
    indices[indicesOffset++] = verticesIndex + 1
    indices[indicesOffset++] = verticesIndex + 3
    indices[indicesOffset++] = verticesIndex + 2

    return { vertices, indices }
  }
}
