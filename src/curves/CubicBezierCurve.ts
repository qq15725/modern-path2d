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

  override copy(source: CubicBezierCurve): this {
    super.copy(source)
    this.v0.copy(source.v0)
    this.v1.copy(source.v1)
    this.v2.copy(source.v2)
    this.v3.copy(source.v3)
    return this
  }
}
