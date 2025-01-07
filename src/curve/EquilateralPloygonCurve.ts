import { Vector2 } from '../math'
import { LineCurve } from './LineCurve'
import { PloygonCurve } from './PloygonCurve'

export class EquilateralPloygonCurve extends PloygonCurve {
  constructor(
    public cx = 0,
    public cy = 0,
    public radius = 1,
    public sideCount = 3,
  ) {
    super()
    this.update()
  }

  update(): this {
    const { cx, cy, radius, sideCount } = this

    const points: Vector2[] = []
    for (let i = 0; i < sideCount; i++) {
      const radian = (i * 2 * Math.PI) / sideCount - 0.5 * Math.PI
      points.push(
        new Vector2(
          radius * Math.cos(radian),
          radius * Math.sin(radian),
        )
          .add({ x: cx, y: cy }),
      )
    }

    const curves = []
    for (let i = 0; i < sideCount; i++) {
      curves.push(
        new LineCurve(
          points[i],
          points[(i + 1) % sideCount],
        ),
      )
    }

    this.curves = curves

    return this
  }

  override copy(source: EquilateralPloygonCurve): this {
    super.copy(source)
    this.cx = source.cx
    this.cy = source.cy
    this.radius = source.radius
    this.sideCount = source.sideCount
    this.update()
    return this
  }
}
