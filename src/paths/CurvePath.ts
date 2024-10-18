import type { VectorLike } from '../math'
import type { PathCommand } from '../types'
import { CubicBezierCurve, Curve, EllipseCurve, LineCurve, QuadraticBezierCurve, RectangularCurve, SplineCurve } from '../curves'
import { BoundingBox, Vector2 } from '../math'
import { addPathCommandsToPath2D, pathDataToPathCommands } from '../svg'

export class CurvePath extends Curve {
  curves: Curve[] = []
  startPoint?: Vector2
  currentPoint = new Vector2()
  autoClose = false

  protected _cacheLengths: number[] = []

  constructor(points?: Vector2[]) {
    super()
    if (points) {
      this.addPoints(points)
    }
  }

  addCurve(curve: Curve): this {
    this.curves.push(curve)
    return this
  }

  addPoints(points: Vector2[]): this {
    this.moveTo(points[0].x, points[0].y)
    for (let i = 1, len = points.length; i < len; i++) {
      const { x, y } = points[i]
      this.lineTo(x, y)
    }
    return this
  }

  addCommands(commands: PathCommand[]): this {
    addPathCommandsToPath2D(commands, this)
    return this
  }

  addData(data: string): this {
    this.addCommands(pathDataToPathCommands(data))
    return this
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const d = t * this.getLength()
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

  override getSpacedPoints(divisions = 40): Vector2[] {
    const points: Vector2[] = []
    for (let i = 0; i <= divisions; i++) {
      points.push(this.getPoint(i / divisions))
    }
    if (this.autoClose) {
      points.push(points[0])
    }
    return points
  }

  override getPoints(divisions = 12): Vector2[] {
    const points: Vector2[] = []
    let last
    for (let i = 0, curves = this.curves; i < curves.length; i++) {
      const curve = curves[i]
      const curvePoints = curve.getPoints(curve.getDivisions(divisions))
      for (let i = 0; i < curvePoints.length; i++) {
        const point = curvePoints[i]
        if (last?.equals(point))
          continue
        points.push(point)
        last = point
      }
    }
    if (
      this.autoClose
      && points.length > 1
      && !points[points.length - 1].equals(points[0])
    ) {
      points.push(points[0])
    }
    return points
  }

  protected _setCurrentPoint(point: VectorLike): this {
    this.currentPoint.copy(point)
    if (!this.startPoint) {
      this.startPoint = this.currentPoint.clone()
    }
    return this
  }

  closePath(): this {
    const start = this.startPoint
    if (start) {
      const end = this.currentPoint
      if (!start.equals(end)) {
        this.curves.push(new LineCurve(end, start))
        this.currentPoint.copy(start)
      }
      this.startPoint = undefined
    }
    return this
  }

  moveTo(x: number, y: number): this {
    this.currentPoint.set(x, y)
    this.startPoint = this.currentPoint.clone()
    return this
  }

  lineTo(x: number, y: number): this {
    this.curves.push(
      new LineCurve(
        this.currentPoint.clone(),
        new Vector2(x, y),
      ),
    )
    this._setCurrentPoint({ x, y })
    return this
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
    this.curves.push(
      new CubicBezierCurve(
        this.currentPoint.clone(),
        new Vector2(cp1x, cp1y),
        new Vector2(cp2x, cp2y),
        new Vector2(x, y),
      ),
    )
    this._setCurrentPoint({ x, y })
    return this
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this {
    this.curves.push(
      new QuadraticBezierCurve(
        this.currentPoint.clone(),
        new Vector2(cpx, cpy),
        new Vector2(x, y),
      ),
    )
    this._setCurrentPoint({ x, y })
    return this
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    this.ellipse(x, y, radius, radius, 0, startAngle, endAngle, counterclockwise)
    return this
  }

  relativeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    const point = this.currentPoint
    this.arc(x + point.x, y + point.y, radius, startAngle, endAngle, counterclockwise)
    return this
  }

  // TODO
  // eslint-disable-next-line unused-imports/no-unused-vars
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this {
    console.warn('Method arcTo not supported yet')
    return this
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise = true): this {
    const curve = new EllipseCurve(
      new Vector2(x, y),
      radiusX,
      radiusY,
      rotation,
      startAngle,
      endAngle,
      !counterclockwise,
    )
    if (this.curves.length > 0) {
      const first = curve.getPoint(0)
      if (!first.equals(this.currentPoint)) {
        this.lineTo(first.x, first.y)
      }
    }
    this.curves.push(curve)
    this._setCurrentPoint(curve.getPoint(1))
    return this
  }

  relativeEllipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    const point = this.currentPoint
    this.ellipse(x + point.x, y + point.y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise)
    return this
  }

  rect(x: number, y: number, w: number, h: number): this {
    this.curves.push(
      new RectangularCurve(
        new Vector2(x + w / 2, y + h / 2),
        w / 2,
        w / h,
      ),
    )
    this._setCurrentPoint({ x, y })
    return this
  }

  splineThru(points: Vector2[]): this {
    this.curves.push(new SplineCurve([this.currentPoint.clone()].concat(points)))
    this._setCurrentPoint(points[points.length - 1])
    return this
  }

  override transformPoint(cb: (point: Vector2) => void): this {
    this.curves.forEach(curve => curve.transformPoint(cb))
    return this
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    this.curves.forEach(curve => curve.getMinMax(min, max))
    return { min, max }
  }

  getBoundingBox(): BoundingBox {
    const { min, max } = this.getMinMax()
    return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
  }

  override getCommands(): PathCommand[] {
    return this.curves.flatMap(curve => curve.getCommands())
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

  override copy(source: CurvePath): this {
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
