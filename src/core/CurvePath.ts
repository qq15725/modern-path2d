import type { Curve } from '../curve'
import type { VectorLike } from '../math'
import type { Path2DCommand } from './Path2DCommand'
import { ArcCurve,
  CompositeCurve,
  CubicBezierCurve,
  EllipseCurve,
  LineCurve,
  QuadraticBezierCurve,
  RectangleCurve,
  RoundRectangleCurve,
  SplineCurve } from '../curve'
import { Vector2 } from '../math'
import { svgPathCommandsAddToPath2D, svgPathDataToCommands } from '../svg'

export class CurvePath extends CompositeCurve {
  startPoint?: Vector2
  currentPoint?: Vector2
  autoClose = false

  constructor(points?: Vector2[]) {
    super()
    if (points) {
      this.addPoints(points)
    }
  }

  addPoints(points: Vector2[]): this {
    this.moveTo(points[0].x, points[0].y)
    for (let i = 1, len = points.length; i < len; i++) {
      const { x, y } = points[i]
      this.lineTo(x, y)
    }
    return this
  }

  addCommands(commands: Path2DCommand[]): this {
    svgPathCommandsAddToPath2D(commands, this)
    return this
  }

  addData(data: string): this {
    this.addCommands(svgPathDataToCommands(data))
    return this
  }

  override getUnevenPointArray(count = 40, output: number[] = []): number[] {
    super.getUnevenPointArray(count, output)
    if (
      this.autoClose
      && output.length >= 4
      && (
        output[0] !== output[output.length - 2]
        && output[1] !== output[output.length - 1]
      )
    ) {
      output.push(output[0], output[1])
    }
    return output
  }

  override getSpacedPointArray(count = 40, output: number[] = []): number[] {
    super.getSpacedPointArray(count, output)
    if (
      this.autoClose
      && output.length >= 4
      && (
        output[0] !== output[output.length - 2]
        && output[1] !== output[output.length - 1]
      )
    ) {
      output.push(output[0], output[1])
    }
    return output
  }

  protected _setCurrentPoint(point: VectorLike): this {
    this.currentPoint = new Vector2(point.x, point.y)
    if (!this.startPoint) {
      this.startPoint = this.currentPoint.clone()
    }
    return this
  }

  protected _connetLineTo(curve: Curve): this {
    if (this.curves.length > 0) {
      const first = curve.getPoint(0)
      if (!this.currentPoint || !first.equals(this.currentPoint)) {
        this.lineTo(first.x, first.y)
      }
    }
    return this
  }

  closePath(): this {
    const start = this.startPoint
    if (start) {
      const end = this.currentPoint
      if (end && !start.equals(end)) {
        this.curves.push(new LineCurve(end.clone(), start.clone()))
        end.copy(start)
      }
      this.startPoint = undefined
    }
    return this
  }

  moveTo(x: number, y: number): this {
    this.currentPoint = new Vector2(x, y)
    this.startPoint = this.currentPoint.clone()
    return this
  }

  lineTo(x: number, y: number): this {
    const start = this.currentPoint
    if (!start?.equals({ x, y })) {
      this.curves.push(
        LineCurve.from(
          start?.x ?? 0, start?.y ?? 0,
          x, y,
        ),
      )
    }
    this._setCurrentPoint({ x, y })
    return this
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
    const start = this.currentPoint
    if (!start?.equals({ x, y })) {
      this.curves.push(
        CubicBezierCurve.from(
          start?.x ?? 0, start?.y ?? 0,
          cp1x, cp1y,
          cp2x, cp2y,
          x, y,
        ),
      )
    }
    this._setCurrentPoint({ x, y })
    return this
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this {
    const start = this.currentPoint
    if (!start?.equals({ x, y })) {
      this.curves.push(
        QuadraticBezierCurve.from(
          start?.x ?? 0, start?.y ?? 0,
          cpx, cpy,
          x, y,
        ),
      )
    }
    this._setCurrentPoint({ x, y })
    return this
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    const curve = new ArcCurve(
      x, y,
      radius,
      startAngle, endAngle,
      !counterclockwise,
    )
    this._connetLineTo(curve)
    this.curves.push(curve)
    this._setCurrentPoint(curve.getPoint(1))
    return this
  }

  relativeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    x += this.currentPoint?.x ?? 0
    y += this.currentPoint?.y ?? 0
    this.arc(x, y, radius, startAngle, endAngle, counterclockwise)
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
      x, y,
      radiusX, radiusY,
      rotation,
      startAngle, endAngle,
      !counterclockwise,
    )
    this._connetLineTo(curve)
    this.curves.push(curve)
    this._setCurrentPoint(curve.getPoint(1))
    return this
  }

  relativeEllipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    x += this.currentPoint?.x ?? 0
    y += this.currentPoint?.y ?? 0
    this.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise)
    return this
  }

  rect(x: number, y: number, width: number, height: number): this {
    const curve = new RectangleCurve(x, y, width, height)
    this._connetLineTo(curve)
    this.curves.push(curve)
    this._setCurrentPoint({ x, y })
    return this
  }

  roundRect(x: number, y: number, width: number, height: number, radii: number): this {
    const curve = new RoundRectangleCurve(x, y, width, height, radii)
    this._connetLineTo(curve)
    this.curves.push(curve)
    this._setCurrentPoint({ x, y })
    return this
  }

  splineThru(points: Vector2[]): this {
    const currentPoint = this.currentPoint ?? new Vector2()
    this.curves.push(new SplineCurve([currentPoint].concat(points)))
    this._setCurrentPoint(points[points.length - 1])
    return this
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
    this.autoClose = source.autoClose
    this.currentPoint = source.currentPoint?.clone()
    return this
  }
}
