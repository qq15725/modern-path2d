import type { PathCommand } from '../types'
import { Vector2 } from '../math'
import { Curve } from './Curve'
import { cubicBezier } from './utils'

export class CubicBezierCurve extends Curve {
  constructor(
    public start = new Vector2(),
    public startControl = new Vector2(),
    public endControl = new Vector2(),
    public end = new Vector2(),
  ) {
    super()
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const { start, startControl, endControl, end } = this
    output.set(
      cubicBezier(t, start.x, startControl.x, endControl.x, end.x),
      cubicBezier(t, start.y, startControl.y, endControl.y, end.y),
    )
    return output
  }

  override transformPoint(cb: (point: Vector2) => void): this {
    cb(this.start)
    cb(this.startControl)
    cb(this.endControl)
    cb(this.end)
    return this
  }

  protected _solveQuadratic(a: number, b: number, c: number): number[] {
    const discriminant = b * b - 4 * a * c
    if (discriminant < 0)
      return []
    const sqrtDiscriminant = Math.sqrt(discriminant)
    const t1 = (-b + sqrtDiscriminant) / (2 * a)
    const t2 = (-b - sqrtDiscriminant) / (2 * a)
    return [t1, t2].filter(t => t >= 0 && t <= 1)
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    const p0 = this.start
    const p1 = this.startControl
    const p2 = this.endControl
    const p3 = this.end
    const dxRoots = this._solveQuadratic(
      3 * (p1.x - p0.x),
      6 * (p2.x - p1.x),
      3 * (p3.x - p2.x),
    )
    const dyRoots = this._solveQuadratic(
      3 * (p1.y - p0.y),
      6 * (p2.y - p1.y),
      3 * (p3.y - p2.y),
    )
    const tValues = [0, 1, ...dxRoots, ...dyRoots]
    const samplePoints = (tValues: number[], precision: number): void => {
      for (const t of tValues) {
        for (let i = 0; i <= precision; i++) {
          const delta = (i / precision - 0.5)
          const refinedT = Math.min(1, Math.max(0, t + delta))
          const point = this.getPoint(refinedT)
          min.x = Math.min(min.x, point.x)
          min.y = Math.min(min.y, point.y)
          max.x = Math.max(max.x, point.x)
          max.y = Math.max(max.y, point.y)
        }
      }
    }
    samplePoints(tValues, 10)
    return { min, max }
  }

  override getCommands(): PathCommand[] {
    const { start, startControl, endControl, end } = this
    return [
      { type: 'M', x: start.x, y: start.y },
      { type: 'C', x1: startControl.x, y1: startControl.y, x2: endControl.x, y2: endControl.y, x: end.x, y: end.y },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { startControl, endControl, end } = this
    ctx.bezierCurveTo(startControl.x, startControl.y, endControl.x, endControl.y, end.x, end.y)
    return this
  }

  override copy(source: CubicBezierCurve): this {
    super.copy(source)
    this.start.copy(source.start)
    this.startControl.copy(source.startControl)
    this.endControl.copy(source.endControl)
    this.end.copy(source.end)
    return this
  }
}
