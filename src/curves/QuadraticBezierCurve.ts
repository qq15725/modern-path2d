import type { Matrix3 } from '../math'
import type { PathCommand } from '../svg'
import { Point2D } from '../math'
import { Curve } from './Curve'
import { quadraticBezier } from './utils'

export class QuadraticBezierCurve extends Curve {
  constructor(
    public v0 = new Point2D(),
    public v1 = new Point2D(),
    public v2 = new Point2D(),
  ) {
    super()
  }

  override getPoint(t: number, output = new Point2D()): Point2D {
    const { v0, v1, v2 } = this
    output.set(
      quadraticBezier(t, v0.x, v1.x, v2.x),
      quadraticBezier(t, v0.y, v1.y, v2.y),
    )
    return output
  }

  override transform(matrix: Matrix3): this {
    this.v0.applyMatrix3(matrix)
    this.v1.applyMatrix3(matrix)
    this.v2.applyMatrix3(matrix)
    return this
  }

  override getMinMax(min = Point2D.MAX, max = Point2D.MIN): { min: Point2D, max: Point2D } {
    const { v0, v1, v2 } = this
    const x1 = 0.5 * (v0.x + v1.x)
    const y1 = 0.5 * (v0.y + v1.y)
    const x2 = 0.5 * (v0.x + v2.x)
    const y2 = 0.5 * (v0.y + v2.y)
    min.x = Math.min(min.x, v0.x, v2.x, x1, x2)
    min.y = Math.min(min.y, v0.y, v2.y, y1, y2)
    max.x = Math.max(max.x, v0.x, v2.x, x1, x2)
    max.y = Math.max(max.y, v0.y, v2.y, y1, y2)
    return { min, max }
  }

  override getCommands(): PathCommand[] {
    const { v0, v1, v2 } = this
    return [
      { type: 'M', x: v0.x, y: v0.y },
      { type: 'Q', x1: v1.x, y1: v1.y, x: v2.x, y: v2.y },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { v1, v2 } = this
    ctx.quadraticCurveTo(v1.x, v1.y, v2.x, v2.y)
    return this
  }

  override copy(source: QuadraticBezierCurve): this {
    super.copy(source)
    this.v0.copy(source.v0)
    this.v1.copy(source.v1)
    this.v2.copy(source.v2)
    return this
  }
}
