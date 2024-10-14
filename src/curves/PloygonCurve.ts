import type { Matrix3 } from '../math'
import type { PathCommand } from '../svg'
import { Point2D } from '../math'
import { Curve } from './Curve'
import { LineCurve } from './LineCurve'

export class PloygonCurve extends Curve {
  curves: LineCurve[] = []
  points: Point2D[] = []
  declare currentLine: LineCurve
  declare pointK: any

  constructor(
    public center: Point2D,
    public radius = 0,
    public num = 0,
    public start = 0,
    public end = 1,
  ) {
    super()
    for (let i = 0; i < this.num; i++) {
      let radian = (i * 2 * Math.PI) / this.num
      radian -= 0.5 * Math.PI
      const point = new Point2D(this.radius * Math.cos(radian), this.radius * Math.sin(radian))
      point.add(this.center)
      this.points.push(point)
    }
    for (let i = 0; i < this.num; i++) {
      this.curves.push(new LineCurve(this.points[i], this.points[(i + 1) % this.num]))
    }
  }

  override getPoint(value: number): Point2D {
    this.getCurrentLine(value)
    return this.currentLine.getPoint(this.pointK)
  }

  override getPointAt(value: number): Point2D {
    return this.getPoint(value)
  }

  getCurrentLine(value: number): LineCurve {
    let pos = (value * (this.end - this.start) + this.start) % 1
    pos < 0 && (pos += 1)
    const v = pos * this.num
    const index = Math.floor(v)
    this.pointK = v - index
    this.currentLine = this.curves[index]
    return this.currentLine
  }

  override getTangent(value: number): Point2D {
    return this.getCurrentLine(value).getTangent(0).normalize()
  }

  getNormal(value: number): Point2D {
    const line = this.getCurrentLine(value)
    return new Point2D(line.v2.y - line.v1.y, -(line.v2.x - line.v1.x)).normalize()
  }

  override transform(matrix: Matrix3): this {
    this.curves.forEach(curve => curve.transform(matrix))
    return this
  }

  override getMinMax(min = Point2D.MAX, max = Point2D.MIN): { min: Point2D, max: Point2D } {
    this.curves.forEach(curve => curve.getMinMax(min, max))
    return { min, max }
  }

  override getCommands(): PathCommand[] {
    return this.curves.flatMap(curve => curve.getCommands())
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    this.curves.forEach(curve => curve.drawTo(ctx))
    return this
  }
}
