import { Vector2 } from '../math'
import { Curve } from './Curve'
import { catmullRom } from './utils'

export class SplineCurve extends Curve {
  constructor(
    public points: Vector2[] = [],
  ) {
    super()
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
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

  override getControlPointRefs(): Vector2[] {
    return this.points
  }

  override copy(source: SplineCurve): this {
    super.copy(source)
    this.points = []
    for (let i = 0, len = source.points.length; i < len; i++) {
      this.points.push(source.points[i].clone())
    }
    return this
  }
}
