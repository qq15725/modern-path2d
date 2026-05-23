import { ArcCurve } from './ArcCurve'
import { CompositeCurve } from './CompositeCurve'
import { LineCurve } from './LineCurve'

/**
 * A rounded rectangle, modelled as a real composite of 4 `LineCurve` edges + 4 quarter
 * `ArcCurve` corners (like {@link RectangleCurve}). `getPoint`/`getLength`/`getMinMax`/
 * `toCommands` therefore describe the actual rounded outline — not a bare ellipse.
 */
export class RoundRectangleCurve extends CompositeCurve {
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
    const { x, y, width, height } = this
    const r = Math.max(0, Math.min(this.radius, Math.abs(width) / 2, Math.abs(height) / 2))
    const x0 = x
    const x1 = x + r
    const x2 = x + width - r
    const x3 = x + width
    const y0 = y
    const y1 = y + r
    const y2 = y + height - r
    const y3 = y + height

    if (r <= 0) {
      this.curves = [
        LineCurve.from(x0, y0, x3, y0),
        LineCurve.from(x3, y0, x3, y3),
        LineCurve.from(x3, y3, x0, y3),
        LineCurve.from(x0, y3, x0, y0),
      ]
    }
    else {
      const HALF_PI = Math.PI / 2
      this.curves = [
        LineCurve.from(x1, y0, x2, y0), // top edge
        new ArcCurve(x2, y1, r, -HALF_PI, 0, true), // top-right corner
        LineCurve.from(x3, y1, x3, y2), // right edge
        new ArcCurve(x2, y2, r, 0, HALF_PI, true), // bottom-right corner
        LineCurve.from(x2, y3, x1, y3), // bottom edge
        new ArcCurve(x1, y2, r, HALF_PI, Math.PI, true), // bottom-left corner
        LineCurve.from(x0, y2, x0, y1), // left edge
        new ArcCurve(x1, y1, r, Math.PI, Math.PI * 1.5, true), // top-left corner
      ]
    }
    this.invalidate()
    return this
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    ctx.roundRect(this.x, this.y, this.width, this.height, this.radius)
    return this
  }

  override copyFrom(source: RoundRectangleCurve): this {
    this.arcLengthDivision = source.arcLengthDivision
    this.x = source.x
    this.y = source.y
    this.width = source.width
    this.height = source.height
    this.radius = source.radius
    this.update()
    return this
  }
}
