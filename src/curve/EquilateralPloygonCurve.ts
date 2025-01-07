import { Vector2 } from '../math'
import { LineCurve } from './LineCurve'
import { PloygonCurve } from './PloygonCurve'

export class EquilateralPloygonCurve extends PloygonCurve {
  constructor(
    public readonly cx = 0,
    public readonly cy = 0,
    public readonly radius = 1,
    public readonly sideCount = 3,
  ) {
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

    super(curves)
  }
}
