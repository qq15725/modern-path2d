import type { PathCommand } from '../types'
import { Curve } from '../Curve'
import { Point2D } from '../Point2D'

export class CircleCurve extends Curve {
  constructor(
    public center: Point2D,
    public radius: number,
    public start = 0,
    public end = Math.PI * 2,
  ) {
    super()
  }

  getPole(min: Point2D, max: Point2D): void {
    min.x = Math.min(min.x, this.center.x - this.radius)
    min.y = Math.min(min.y, this.center.y - this.radius)
    max.x = Math.max(max.x, this.center.x + this.radius)
    max.y = Math.max(max.y, this.center.y + this.radius)
  }

  override getPoint(index: number): Point2D {
    const { radius, center } = this
    return center.clone().add(this.getNormal(index).clone().multiplyScalar(radius))
  }

  override getTangent(index: number): Point2D {
    const { x, y } = this.getNormal(index)
    return new Point2D(-y, x)
  }

  getNormal(index: number): Point2D {
    const { start, end } = this
    const t = index * (end - start) + start - 0.5 * Math.PI
    return new Point2D(Math.cos(t), Math.sin(t))
  }

  override toPathCommands(): PathCommand[] {
    // TODO
    return []
  }

  override drawTo(_ctx: CanvasRenderingContext2D): void {
    // TODO
  }
}
