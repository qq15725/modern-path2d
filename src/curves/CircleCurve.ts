import { Point2D } from '../math'
import { Curve } from './Curve'

export class CircleCurve extends Curve {
  constructor(
    public center: Point2D,
    public radius: number,
    public start = 0,
    public end = Math.PI * 2,
  ) {
    super()
  }

  override getPoint(t: number): Point2D {
    const { radius, center } = this
    return center.clone().add(this.getNormal(t).clone().multiplyScalar(radius))
  }

  override getTangent(t: number): Point2D {
    const { x, y } = this.getNormal(t)
    return new Point2D(-y, x)
  }

  getNormal(t: number): Point2D {
    const { start, end } = this
    const _t = t * (end - start) + start - 0.5 * Math.PI
    return new Point2D(Math.cos(_t), Math.sin(_t))
  }

  override getMinMax(min = Point2D.MAX, max = Point2D.MIN): { min: Point2D, max: Point2D } {
    min.x = Math.min(min.x, this.center.x - this.radius)
    min.y = Math.min(min.y, this.center.y - this.radius)
    max.x = Math.max(max.x, this.center.x + this.radius)
    max.y = Math.max(max.y, this.center.y + this.radius)
    return { min, max }
  }
}
