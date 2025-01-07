import { Vector2 } from '../math'
import { RoundCurve } from './RoundCurve'

export class EllipseCurve extends RoundCurve {
  constructor(
    cx = 0, cy = 0,
    rx = 1, ry = 1,
    rotate = 0,
    startAngle = 0,
    endAngle = Math.PI * 2,
    clockwise = false,
  ) {
    super(
      new Vector2(cx, cy),
      new Vector2(rx, ry),
      new Vector2(),
      rotate,
      startAngle,
      endAngle,
      clockwise,
    )
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    ctx.ellipse(
      this.cx, this.cy,
      this.rx, this.ry,
      this.rotate,
      this.startAngle,
      this.endAngle,
      !this.clockwise,
    )
    return this
  }
}
