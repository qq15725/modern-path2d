import type { PathCommand } from '../types'
import { Curve } from '../Curve'
import { Point2D } from '../Point2D'
import { cubicBezier } from '../utils'

export class CubicBezierCurve extends Curve {
  constructor(
    public v0 = new Point2D(),
    public v1 = new Point2D(),
    public v2 = new Point2D(),
    public v3 = new Point2D(),
  ) {
    super()
  }

  override getPoint(t: number, output = new Point2D()): Point2D {
    const { v0, v1, v2, v3 } = this
    output.set(
      cubicBezier(t, v0.x, v1.x, v2.x, v3.x),
      cubicBezier(t, v0.y, v1.y, v2.y, v3.y),
    )
    return output
  }

  override getMinMax(min = Point2D.MAX, max = Point2D.MIN): { min: Point2D, max: Point2D } {
    const { v0, v1, v2, v3 } = this
    min.x = Math.min(min.x, v0.x, v1.x, v2.x, v3.x)
    min.y = Math.min(min.y, v0.y, v1.y, v2.y, v3.y)
    max.x = Math.max(max.x, v0.x, v1.x, v2.x, v3.x)
    max.y = Math.max(max.y, v0.y, v1.y, v2.y, v3.y)
    return { min, max }
  }

  override getCommands(): PathCommand[] {
    const { v0, v1, v2, v3 } = this
    return [
      { type: 'M', x: v0.x, y: v0.y },
      { type: 'C', x1: v1.x, y1: v1.y, x2: v2.x, y2: v2.y, x: v3.x, y: v3.y },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): void {
    const { v0, v1, v2, v3 } = this
    ctx.moveTo(v0.x, v0.y)
    ctx.bezierCurveTo(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y)
  }

  override copy(source: CubicBezierCurve): this {
    super.copy(source)
    this.v0.copy(source.v0)
    this.v1.copy(source.v1)
    this.v2.copy(source.v2)
    this.v3.copy(source.v3)
    return this
  }
}
