import { Vector2 } from '../math'
import { CompositeCurve } from './CompositeCurve'
import { LineCurve } from './LineCurve'

export class PloygonCurve extends CompositeCurve<LineCurve> {
  static equilateral(
    cx = 0,
    cy = 0,
    radius = 1,
    sideCount = 3,
  ): PloygonCurve {
    const ploygon = new PloygonCurve()
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
    for (let i = 0; i < sideCount; i++) {
      ploygon.curves.push(
        LineCurve.from(points[i], points[(i + 1) % sideCount]),
      )
    }
    return ploygon
  }
}
