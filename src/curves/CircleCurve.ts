import { Vector2 } from '../math'
import { Curve } from './Curve'

export class CircleCurve extends Curve {
  constructor(
    public center: Vector2,
    public radius: number,
    public start = 0,
    public end = Math.PI * 2,
  ) {
    super()
  }

  override getPoint(t: number): Vector2 {
    const { radius, center } = this
    return center.clone().add(this.getNormal(t).clone().scale(radius))
  }

  override getTangent(t: number, output = new Vector2()): Vector2 {
    const { x, y } = this.getNormal(t)
    return output.set(-y, x)
  }

  override getNormal(t: number, output = new Vector2()): Vector2 {
    const { start, end } = this
    const _t = t * (end - start) + start - 0.5 * Math.PI
    return output.set(Math.cos(_t), Math.sin(_t))
  }

  override getControlPoints(): Vector2[] {
    return [this.center]
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    min.x = Math.min(min.x, this.center.x - this.radius)
    min.y = Math.min(min.y, this.center.y - this.radius)
    max.x = Math.max(max.x, this.center.x + this.radius)
    max.y = Math.max(max.y, this.center.y + this.radius)
    return { min, max }
  }
}
