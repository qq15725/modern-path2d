import type { PathCommand } from '../svg'
import { CubicBezierCurve, Curve, EllipseCurve, LineCurve, QuadraticBezierCurve, RectangularCurve, SplineCurve } from '../curves'
import { Point2D } from '../math'

export class CurvePath extends Curve {
  curves: Curve[] = []
  currentPoint = new Point2D()
  autoClose = false

  protected _cacheLengths: number[] = []

  constructor(points?: Point2D[]) {
    super()
    if (points) {
      this.setFromPoints(points)
    }
  }

  addCurve(curve: Curve): this {
    this.curves.push(curve)
    return this
  }

  closePath(): this {
    const start = this.curves[0].getPoint(0)
    const end = this.curves[this.curves.length - 1].getPoint(1)
    if (!start.equals(end)) {
      this.curves.push(new LineCurve(end, start))
    }
    return this
  }

  override getPoint(position: number, output = new Point2D()): Point2D {
    const d = position * this.getLength()
    const curveLengths = this.getCurveLengths()
    let i = 0
    while (i < curveLengths.length) {
      if (curveLengths[i] >= d) {
        const diff = curveLengths[i] - d
        const curve = this.curves[i]
        const segmentLength = curve.getLength()
        return curve.getPointAt(segmentLength === 0 ? 0 : 1 - diff / segmentLength, output)
      }
      i++
    }
    return output
  }

  override getLength(): number {
    const lengths = this.getCurveLengths()
    return lengths[lengths.length - 1]
  }

  override updateArcLengths(): void {
    super.updateArcLengths()
    this._cacheLengths = []
    this.getCurveLengths()
  }

  getCurveLengths(): number[] {
    if (this._cacheLengths.length === this.curves.length) {
      return this._cacheLengths
    }
    const lengths = []
    let sums = 0
    for (let i = 0, l = this.curves.length; i < l; i++) {
      sums += this.curves[i].getLength()
      lengths.push(sums)
    }
    this._cacheLengths = lengths
    return lengths
  }

  override getSpacedPoints(divisions = 40): Point2D[] {
    const points: Point2D[] = []
    for (let i = 0; i <= divisions; i++) {
      points.push(this.getPoint(i / divisions))
    }
    if (this.autoClose) {
      points.push(points[0])
    }
    return points
  }

  override getPoints(divisions = 12): Point2D[] {
    const points: Point2D[] = []
    let last
    for (let i = 0, curves = this.curves; i < curves.length; i++) {
      const curve = curves[i]
      const pts = curve.getPoints(curve.getDivisions(divisions))
      for (let i = 0; i < pts.length; i++) {
        const point = pts[i]
        if (last && last.equals(point))
          continue
        points.push(point)
        last = point
      }
    }
    if (this.autoClose && points.length > 1 && !points[points.length - 1].equals(points[0])) {
      points.push(points[0])
    }
    return points
  }

  setFromPoints(points: Point2D[]): this {
    this.moveTo(points[0].x, points[0].y)
    for (let i = 1, l = points.length; i < l; i++) {
      this.lineTo(points[i].x, points[i].y)
    }
    return this
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
    this.curves.push(
      new CubicBezierCurve(
        this.currentPoint.clone(),
        new Point2D(cp1x, cp1y),
        new Point2D(cp2x, cp2y),
        new Point2D(x, y),
      ),
    )
    this.currentPoint.set(x, y)
    return this
  }

  lineTo(x: number, y: number): this {
    this.curves.push(
      new LineCurve(
        this.currentPoint.clone(),
        new Point2D(x, y),
      ),
    )
    this.currentPoint.set(x, y)
    return this
  }

  moveTo(x: number, y: number): this {
    this.currentPoint.set(x, y)
    return this
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this {
    this.curves.push(
      new QuadraticBezierCurve(
        this.currentPoint.clone(),
        new Point2D(cpx, cpy),
        new Point2D(x, y),
      ),
    )
    this.currentPoint.set(x, y)
    return this
  }

  rect(x: number, y: number, w: number, h: number): this {
    this.curves.push(
      new RectangularCurve(
        new Point2D(x + w / 2, y + h / 2),
        w / 2,
        w / h,
      ),
    )
    this.currentPoint.set(x, y)
    return this
  }

  splineThru(points: Point2D[]): this {
    const npts = [this.currentPoint.clone()].concat(points)
    this.curves.push(new SplineCurve(npts))
    this.currentPoint.copy(points[points.length - 1])
    return this
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, clockwise = false): this {
    const point = this.currentPoint
    this.absarc(x + point.x, y + point.y, radius, startAngle, endAngle, clockwise)
    return this
  }

  absarc(x: number, y: number, radius: number, startAngle: number, endAngle: number, clockwise = false): this {
    this.absellipse(x, y, radius, radius, startAngle, endAngle, clockwise)
    return this
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, startAngle: number, endAngle: number, clockwise = false, rotation = 0): this {
    const point = this.currentPoint
    this.absellipse(x + point.x, y + point.y, radiusX, radiusY, startAngle, endAngle, clockwise, rotation)
    return this
  }

  absellipse(x: number, y: number, radiusX: number, radiusY: number, startAngle: number, endAngle: number, clockwise = false, rotation = 0): this {
    const curve = new EllipseCurve(x, y, radiusX, radiusY, startAngle, endAngle, clockwise, rotation)
    if (this.curves.length > 0) {
      const firstPoint = curve.getPoint(0)
      if (!firstPoint.equals(this.currentPoint)) {
        this.lineTo(firstPoint.x, firstPoint.y)
      }
    }
    this.curves.push(curve)
    this.currentPoint.copy(curve.getPoint(1))
    return this
  }

  override getCommands(): PathCommand[] {
    return this.curves.flatMap(curve => curve.getCommands())
  }

  override getMinMax(min = Point2D.MAX, max = Point2D.MIN): { min: Point2D, max: Point2D } {
    this.curves.forEach(curve => curve.getMinMax(min, max))
    return { min, max }
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const point = this.curves[0]?.getPoint(0)
    if (point) {
      ctx.moveTo(point.x, point.y)
    }
    this.curves.forEach(curve => curve.drawTo(ctx))
    if (this.autoClose) {
      ctx.closePath()
    }
    return this
  }

  copy(source: CurvePath): this {
    super.copy(source)
    this.curves = []
    for (let i = 0, len = source.curves.length; i < len; i++) {
      this.curves.push(source.curves[i].clone())
    }
    this.autoClose = source.autoClose
    this.currentPoint.copy(source.currentPoint)
    return this
  }
}
