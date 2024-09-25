import type { PathCommand } from '../types'
import { Curve } from '../Curve'
import { Point2D } from '../Point2D'
import { LineCurve } from './LineCurve'

export class RectangularCurve extends Curve {
  curves: LineCurve[] = []
  pointT = 0

  constructor(
    public center: Point2D,
    public width: number,
    public aspectRatio = 1,
    public start = 0,
    public end = 1,
  ) {
    super()
    const { x, y } = this.center
    const offsetX = this.width
    const offsetY = this.width / this.aspectRatio
    const points: Point2D[] = [
      new Point2D(x - offsetX, y - offsetY),
      new Point2D(x + offsetX, y - offsetY),
      new Point2D(x + offsetX, y + offsetY),
      new Point2D(x - offsetX, y + offsetY),
    ]
    for (let i = 0; i < 4; i++) {
      this.curves.push(new LineCurve(points[i], points[(i + 1) % 4]))
    }
  }

  override getPoint(t: number): Point2D {
    return this.getCurrentLine(t).getPoint(this.pointT)
  }

  override getPointAt(u: number): Point2D {
    return this.getPoint(u)
  }

  getCurrentLine(t: number): LineCurve {
    let flag = (t * (this.end - this.start) + this.start) % 1
    flag < 0 && (flag += 1)
    flag *= (1 + this.aspectRatio) * 2
    let i
    if (flag < this.aspectRatio) {
      i = 0
      this.pointT = flag / this.aspectRatio
    }
    else if (flag < this.aspectRatio + 1) {
      i = 1
      this.pointT = (flag - this.aspectRatio) / 1
    }
    else if (flag < 2 * this.aspectRatio + 1) {
      i = 2
      this.pointT = (flag - this.aspectRatio - 1) / this.aspectRatio
    }
    else {
      i = 3
      this.pointT = (flag - 2 * this.aspectRatio - 1) / 1
    }
    return this.curves[i]
  }

  override getTangent(t: number): Point2D {
    return this.getCurrentLine(t).getTangent(0).normalize()
  }

  getNormal(value: number): Point2D {
    const { v1, v2 } = this.getCurrentLine(value)
    return new Point2D(v2.y - v1.y, -(v2.x - v1.x)).normalize()
  }

  override toPathCommands(): PathCommand[] {
    return this.curves.flatMap(curve => curve.toPathCommands())
  }
}
