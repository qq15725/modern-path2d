import type { PathCommand } from '../types'
import { Curve } from '../Curve'
import { Point2D } from '../Point2D'
import { catmullRom } from '../utils'

export class SplineCurve extends Curve {
  constructor(public points: Point2D[] = []) {
    super()
  }

  override getDivisions(divisions: number = 12): number {
    return divisions * this.points.length
  }

  override getPoint(t: number, output = new Point2D()): Point2D {
    const { points } = this
    const p = (points.length - 1) * t
    const _p = Math.floor(p)
    const weight = p - _p
    const p0 = points[_p === 0 ? _p : _p - 1]
    const p1 = points[_p]
    const p2 = points[_p > points.length - 2 ? points.length - 1 : _p + 1]
    const p3 = points[_p > points.length - 3 ? points.length - 1 : _p + 2]
    output.set(
      catmullRom(weight, p0.x, p1.x, p2.x, p3.x),
      catmullRom(weight, p0.y, p1.y, p2.y, p3.y),
    )
    return output
  }

  override toPathCommands(): PathCommand[] {
    // TODO
    return []
  }

  override drawTo(_ctx: CanvasRenderingContext2D): void {
    // TODO
  }

  override copy(source: SplineCurve): this {
    super.copy(source)
    this.points = []
    for (let i = 0, l = source.points.length; i < l; i++) {
      const point = source.points[i]
      this.points.push(point.clone())
    }
    return this
  }
}
