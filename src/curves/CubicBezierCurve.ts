import type { PathCommand } from '../svg'
import { Vector2 } from '../math'
import { Curve } from './Curve'
import { cubicBezier } from './utils'

export class CubicBezierCurve extends Curve {
  constructor(
    public start = new Vector2(),
    public startControl = new Vector2(),
    public endControl = new Vector2(),
    public end = new Vector2(),
  ) {
    super()
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const { start, startControl, endControl, end } = this
    output.set(
      cubicBezier(t, start.x, startControl.x, endControl.x, end.x),
      cubicBezier(t, start.y, startControl.y, endControl.y, end.y),
    )
    return output
  }

  override transformPoint(cb: (point: Vector2) => void): this {
    cb(this.start)
    cb(this.startControl)
    cb(this.endControl)
    cb(this.end)
    return this
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    const { start, startControl, endControl, end } = this
    min.x = Math.min(min.x, start.x, startControl.x, endControl.x, end.x)
    min.y = Math.min(min.y, start.y, startControl.y, endControl.y, end.y)
    max.x = Math.max(max.x, start.x, startControl.x, endControl.x, end.x)
    max.y = Math.max(max.y, start.y, startControl.y, endControl.y, end.y)
    return { min, max }
  }

  override getCommands(): PathCommand[] {
    const { start, startControl, endControl, end } = this
    return [
      { type: 'M', x: start.x, y: start.y },
      { type: 'C', x1: startControl.x, y1: startControl.y, x2: endControl.x, y2: endControl.y, x: end.x, y: end.y },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { startControl, endControl, end } = this
    ctx.bezierCurveTo(startControl.x, startControl.y, endControl.x, endControl.y, end.x, end.y)
    return this
  }

  override copy(source: CubicBezierCurve): this {
    super.copy(source)
    this.start.copy(source.start)
    this.startControl.copy(source.startControl)
    this.endControl.copy(source.endControl)
    this.end.copy(source.end)
    return this
  }
}
