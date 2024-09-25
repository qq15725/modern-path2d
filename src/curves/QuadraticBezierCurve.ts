import { Curve } from '../Curve'
import { Point2D } from '../Point2D'
import { quadraticBezier } from '../utils'

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

  override copy(source: QuadraticBezierCurve): this {
    super.copy(source)
    this.v0.copy(source.v0)
    this.v1.copy(source.v1)
    this.v2.copy(source.v2)
    return this
  }
}
