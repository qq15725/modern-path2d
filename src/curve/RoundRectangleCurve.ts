import { Vector2 } from '../math'
import { RoundCurve } from './RoundCurve'

export class RoundRectangleCurve extends RoundCurve {
  constructor(
    public readonly x = 0,
    public readonly y = 0,
    public readonly width = 1,
    public readonly height = 1,
    public readonly radius = 1,
  ) {
    const halfWidth = width / 2
    const halfHeight = height / 2
    const cx = x + halfWidth
    const cy = y + halfHeight
    const rx = Math.max(0, Math.min(radius, Math.min(halfWidth, halfHeight)))
    const ry = rx
    const dx = halfWidth - rx
    const dy = halfHeight - ry
    super(
      new Vector2(cx, cy),
      new Vector2(rx, ry),
      new Vector2(dx, dy),
    )
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { x, y, width, height, radius } = this
    ctx.roundRect(x, y, width, height, radius)
    return this
  }
}
