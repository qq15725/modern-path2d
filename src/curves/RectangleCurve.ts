import type { FillTriangulateOptions } from '../utils'
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
    super()
    this.update()
  }

  update(): this {
    const { x, y, width, height } = this

    const points = [
      new Vector2(x, y),
      new Vector2(x + width, y),
      new Vector2(x + width, y + height),
      new Vector2(x, y + height),
    ]

    this.curves = [
      new LineCurve(points[0], points[1]),
      new LineCurve(points[1], points[2]),
      new LineCurve(points[2], points[3]),
      new LineCurve(points[3], points[0]),
    ]

    return this
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    ctx.rect(this.x, this.y, this.width, this.height)
    return this
  }

  override getFillVertices(_options: FillTriangulateOptions = {}): number[] {
    const { x, y, width, height } = this

    return [
      x, y,
      x + width, y,
      x + width, y + height,
      x, y + height,
    ]
  }

  override copy(source: RectangleCurve): this {
    super.copy(source)
    this.x = source.x
    this.y = source.y
    this.width = source.width
    this.height = source.height
    this.update()
    return this
  }
}
