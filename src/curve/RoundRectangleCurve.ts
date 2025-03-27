import { Vector2 } from '../math'
import { RoundCurve } from './RoundCurve'

export class RoundRectangleCurve extends RoundCurve {
  constructor(
    public x = 0,
    public y = 0,
    public width = 1,
    public height = 1,
    public radius = 1,
  ) {
    super()
    this.update()
  }

  update(): this {
    const { x, y, width, height, radius } = this
    const halfWidth = width / 2
    const halfHeight = height / 2
    const cx = x + halfWidth
    const cy = y + halfHeight
    const rx = Math.max(0, Math.min(radius, Math.min(halfWidth, halfHeight)))
    const ry = rx
    this._center = new Vector2(cx, cy)
    this._radius = new Vector2(rx, ry)
    this._diff = new Vector2(width, height)
    return this
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { x, y, width, height, radius } = this
    ctx.roundRect(x, y, width, height, radius)
    return this
  }

  override copy(source: RoundRectangleCurve): this {
    super.copy(source)
    this.x = source.x
    this.y = source.y
    this.width = source.width
    this.height = source.height
    this.radius = source.radius
    this.update()
    return this
  }
}
