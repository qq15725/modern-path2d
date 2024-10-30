import type { PathCommand } from '../types'
import { Vector2 } from '../math'
import { Curve } from './Curve'
import { quadraticBezier } from './utils'

export class QuadraticBezierCurve extends Curve {
  constructor(
    public start = new Vector2(),
    public control = new Vector2(),
    public end = new Vector2(),
  ) {
    super()
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const { start, control, end } = this
    output.set(
      quadraticBezier(t, start.x, control.x, end.x),
      quadraticBezier(t, start.y, control.y, end.y),
    )
    return output
  }

  override getControlPoints(): Vector2[] {
    return [
      this.start,
      this.control,
      this.end,
    ]
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    const { start, control, end } = this
    const x1 = 0.5 * (start.x + control.x)
    const y1 = 0.5 * (start.y + control.y)
    const x2 = 0.5 * (start.x + end.x)
    const y2 = 0.5 * (start.y + end.y)
    min.x = Math.min(min.x, start.x, end.x, x1, x2)
    min.y = Math.min(min.y, start.y, end.y, y1, y2)
    max.x = Math.max(max.x, start.x, end.x, x1, x2)
    max.y = Math.max(max.y, start.y, end.y, y1, y2)
    return { min, max }
  }

  override toCommands(): PathCommand[] {
    const { start, control, end } = this
    return [
      { type: 'M', x: start.x, y: start.y },
      { type: 'Q', x1: control.x, y1: control.y, x: end.x, y: end.y },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { start, control, end } = this
    ctx.lineTo(start.x, start.y)
    ctx.quadraticCurveTo(control.x, control.y, end.x, end.y)
    return this
  }

  override copy(source: QuadraticBezierCurve): this {
    super.copy(source)
    this.start.copy(source.start)
    this.control.copy(source.control)
    this.end.copy(source.end)
    return this
  }
}
