import { Vector2 } from '../math'
import { RoundCurve } from './RoundCurve'

export class ArcCurve extends RoundCurve {
  constructor(
    cx = 0, cy = 0,
    radius = 1,
    startAngle = 0,
    endAngle = Math.PI * 2,
    clockwise = false,
  ) {
    super(
      new Vector2(cx, cy),
      new Vector2(radius, radius),
      new Vector2(),
      0,
      startAngle,
      endAngle,
      clockwise,
    )
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { cx, cy, rx, startAngle, endAngle, clockwise } = this
    ctx.arc(
      cx, cy,
      rx,
      startAngle,
      endAngle,
      !clockwise,
    )
    return this
  }
}
