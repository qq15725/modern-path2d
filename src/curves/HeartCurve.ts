import type { PathCommand } from '../types'
import { Curve } from '../Curve'
import { Point2D } from '../Point2D'
import { CircleCurve } from './CircleCurve'
import { LineCurve } from './LineCurve'

export class HeartCurve extends Curve {
  curves: Curve[]
  pointT = 0

  constructor(
    public center: Point2D,
    public size: number,
    public start = 0,
    public end = 1,
  ) {
    super()
    const { x, y } = this.center
    const A = new Point2D(x + 0.5 * this.size, y - 0.5 * this.size)
    const t = new Point2D(x - 0.5 * this.size, y - 0.5 * this.size)
    const i = new Point2D(x, y + 0.5 * this.size)
    const curve1 = new CircleCurve(A, Math.SQRT1_2 * this.size, -0.25 * Math.PI, 0.75 * Math.PI)
    const curve5 = new CircleCurve(t, Math.SQRT1_2 * this.size, -0.75 * Math.PI, 0.25 * Math.PI)
    const curve3 = new CircleCurve(i, 0.5 * Math.SQRT1_2 * this.size, 0.75 * Math.PI, 1.25 * Math.PI)
    const e = new Point2D(x, y + this.size)
    const l = new Point2D(x + this.size, y)
    const c = new Point2D().lerpVectors(l, e, 0.75)
    const h = new Point2D(x - this.size, y)
    const a = new Point2D().lerpVectors(h, e, 0.75)
    const curve2 = new LineCurve(l, c)
    const curve4 = new LineCurve(a, h)
    this.curves = [curve1, curve2, curve3, curve4, curve5]
  }

  override getPoint(value: number): Point2D {
    return this.getCurrentLine(value).getPoint(this.pointT)
  }

  override getPointAt(value: number): Point2D {
    return this.getPoint(value)
  }

  getCurrentLine(value: number): Curve {
    let val = (value * (this.end - this.start) + this.start) % 1
    val < 0 && (val += 1)
    val *= (9 * Math.PI) / 8 + 1.5
    let index
    const t = 0.5 * Math.PI
    if (val < t) {
      index = 0
      this.pointT = val / t
    }
    else if (val < t + 0.75) {
      index = 1
      this.pointT = (val - t) / 0.75
    }
    else if (val < (5 * Math.PI) / 8 + 0.75) {
      index = 2
      this.pointT = (val - t - 0.75) / (Math.PI / 8)
    }
    else if (val < (5 * Math.PI) / 8 + 1.5) {
      index = 3
      this.pointT = (val - (5 * Math.PI) / 8 - 0.75) / 0.75
    }
    else {
      index = 4
      this.pointT = (val - (5 * Math.PI) / 8 - 1.5) / t
    }
    return this.curves[index]
  }

  override getTangent(value: number): Point2D {
    return this.getCurrentLine(value).getTangent(this.pointT).normalize()
  }

  getNormal(value: number): Point2D {
    const line = this.getCurrentLine(value) as any
    return new Point2D(line.v2.y - line.v1.y, -(line.v2.x - line.v1.x)).normalize()
  }

  override toPathCommands(): PathCommand[] {
    return this.curves.flatMap(curve => curve.toPathCommands())
  }

  override drawTo(ctx: CanvasRenderingContext2D): void {
    this.curves.forEach(curve => curve.drawTo(ctx))
  }
}
