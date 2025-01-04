import type { Path2DCommand } from '../core'
import { Vector2 } from '../math'
import { Curve } from './Curve'
import { cubicBezier, getAdaptiveCubicBezierCurvePoints } from './utils'

export class CubicBezierCurve extends Curve {
  p1: Vector2
  cp1: Vector2
  cp2: Vector2
  p2: Vector2

  static from(p1: Vector2, cp1: Vector2, cp2: Vector2, p2: Vector2): CubicBezierCurve {
    return new CubicBezierCurve(
      p1.x, p1.y,
      cp1.x, cp1.y,
      cp2.x, cp2.y,
      p2.x, p2.y,
    )
  }

  constructor(
    p1x: number, p1y: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    p2x: number, p2y: number,
  ) {
    super()
    this.p1 = new Vector2(p1x, p1y)
    this.cp1 = new Vector2(cp1x, cp1y)
    this.cp2 = new Vector2(cp2x, cp2y)
    this.p2 = new Vector2(p2x, p2y)
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const { p1, cp1, cp2, p2 } = this
    return output.set(
      cubicBezier(t, p1.x, cp1.x, cp2.x, p2.x),
      cubicBezier(t, p1.y, cp1.y, cp2.y, p2.y),
    )
  }

  override getAdaptivePoints(output: number[] = []): number[] {
    return getAdaptiveCubicBezierCurvePoints(
      output,
      this.p1.x, this.p1.y,
      this.cp1.x, this.cp1.y,
      this.cp2.x, this.cp2.y,
      this.p2.x, this.p2.y,
    )
  }

  override getControlPointRefs(): Vector2[] {
    return [this.p1, this.cp1, this.cp2, this.p2]
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
    const { p1, cp1, cp2, p2 } = this
    const dxRoots = this._solveQuadratic(
      3 * (cp1.x - p1.x),
      6 * (cp2.x - cp1.x),
      3 * (p2.x - cp2.x),
    )
    const dyRoots = this._solveQuadratic(
      3 * (cp1.y - p1.y),
      6 * (cp2.y - cp1.y),
      3 * (p2.y - cp2.y),
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

  override toCommands(): Path2DCommand[] {
    const { p1, cp1, cp2, p2 } = this
    return [
      { type: 'M', x: p1.x, y: p1.y },
      { type: 'C', x1: cp1.x, y1: cp1.y, x2: cp2.x, y2: cp2.y, x: p2.x, y: p2.y },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { p1, cp1, cp2, p2 } = this
    ctx.lineTo(p1.x, p1.y)
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y)
    return this
  }

  override copy(source: CubicBezierCurve): this {
    super.copy(source)
    this.p1.copy(source.p1)
    this.cp1.copy(source.cp1)
    this.cp2.copy(source.cp2)
    this.p2.copy(source.p2)
    return this
  }
}
