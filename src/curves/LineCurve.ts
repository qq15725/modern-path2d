import type { Path2DCommand } from '../core'
import type { FillTriangulatedResult, FillTriangulateOptions } from './utils'
import { Vector2 } from '../math'
import { Curve } from './Curve'

export class LineCurve extends Curve {
  static from(
    p1x: number, p1y: number,
    p2x: number, p2y: number,
  ): LineCurve {
    return new LineCurve(
      new Vector2(p1x, p1y),
      new Vector2(p2x, p2y),
    )
  }

  constructor(
    public p1 = new Vector2(),
    public p2 = new Vector2(),
  ) {
    super()
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    if (t === 1) {
      output.copy(this.p2)
    }
    else {
      output
        .copy(this.p2)
        .sub(this.p1)
        .scale(t)
        .add(this.p1)
    }
    return output
  }

  override getPointAt(u: number, output = new Vector2()): Vector2 {
    return this.getPoint(u, output)
  }

  override getTangent(_t: number, output = new Vector2()): Vector2 {
    return output.subVectors(this.p2, this.p1).normalize()
  }

  override getTangentAt(u: number, output = new Vector2()): Vector2 {
    return this.getTangent(u, output)
  }

  override getControlPointRefs(): Vector2[] {
    return [this.p1, this.p2]
  }

  override getAdaptivePointArray(output: number[] = []): number[] {
    output.push(
      this.p1.x, this.p1.y,
      this.p2.x, this.p2.y,
    )
    return output
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    const { p1, p2 } = this
    min.x = Math.min(min.x, p1.x, p2.x)
    min.y = Math.min(min.y, p1.y, p2.y)
    max.x = Math.max(max.x, p1.x, p2.x)
    max.y = Math.max(max.y, p1.y, p2.y)
    return { min: min.finite(), max: max.finite() }
  }

  override toCommands(): Path2DCommand[] {
    const { p1, p2 } = this
    return [
      { type: 'M', x: p1.x, y: p1.y },
      { type: 'L', x: p2.x, y: p2.y },
    ]
  }

  override fillTriangulate(options: FillTriangulateOptions = {}): FillTriangulatedResult {
    let {
      vertices = [],
      indices = [],
      verticesStride = 2,
      verticesOffset = vertices.length / verticesStride,
      indicesOffset = indices.length,
    } = options

    const minX = Math.min(this.p1.x, this.p2.x)
    const maxX = Math.max(this.p1.x, this.p2.x)
    const minY = Math.min(this.p1.y, this.p2.y)
    const maxY = Math.max(this.p1.y, this.p2.y)

    const x = minX
    const y = minY
    const width = (maxX - minX)
    const height = (maxY - minY)

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

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { p1, p2 } = this
    ctx.lineTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    return this
  }

  override copy(source: LineCurve): this {
    super.copy(source)
    this.p1.copy(source.p1)
    this.p2.copy(source.p2)
    return this
  }
}
