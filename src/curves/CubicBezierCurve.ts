import type { Path2DCommand } from '../types'
import { Curve } from '../core/Curve'
import { Vector2 } from '../math'
import { cubicBezier, getAdaptiveCubicBezierCurvePoints } from '../utils'

export class CubicBezierCurve extends Curve {
  static from(
    p1x: number, p1y: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    p2x: number, p2y: number,
  ): CubicBezierCurve {
    return new CubicBezierCurve(
      new Vector2(p1x, p1y),
      new Vector2(cp1x, cp1y),
      new Vector2(cp2x, cp2y),
      new Vector2(p2x, p2y),
    )
  }

  constructor(
    public p1 = new Vector2(),
    public cp1 = new Vector2(),
    public cp2 = new Vector2(),
    public p2 = new Vector2(),
  ) {
    super()
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const { p1, cp1, cp2, p2 } = this
    return output.set(
      cubicBezier(t, p1.x, cp1.x, cp2.x, p2.x),
      cubicBezier(t, p1.y, cp1.y, cp2.y, p2.y),
    )
  }

  override getAdaptiveVertices(output: number[] = []): number[] {
    return getAdaptiveCubicBezierCurvePoints(
      this.p1.x, this.p1.y,
      this.cp1.x, this.cp1.y,
      this.cp2.x, this.cp2.y,
      this.p2.x, this.p2.y,
      0.5,
      output,
    )
  }

  override getControlPointRefs(): Vector2[] {
    return [this.p1, this.cp1, this.cp2, this.p2]
  }

  // Swap endpoint and control-point references; keeps shared corner Vector2s intact.
  override reverse(): this {
    const { p1, cp1, cp2, p2 } = this
    this.p1 = p2
    this.cp1 = cp2
    this.cp2 = cp1
    this.p2 = p1
    this.invalidate()
    return this
  }

  protected _solveQuadratic(a: number, b: number, c: number): number[] {
    if (Math.abs(a) < 1e-12) {
      // Linear: b*t + c = 0
      if (Math.abs(b) < 1e-12)
        return []
      const t = -c / b
      return t >= 0 && t <= 1 ? [t] : []
    }
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
    // B'(t) = 3(cp1-p1) + 6(p1-2cp1+cp2)*t + 3(-p1+3cp1-3cp2+p2)*t^2, per axis.
    const dxRoots = this._solveQuadratic(
      3 * (-p1.x + 3 * cp1.x - 3 * cp2.x + p2.x),
      6 * (p1.x - 2 * cp1.x + cp2.x),
      3 * (cp1.x - p1.x),
    )
    const dyRoots = this._solveQuadratic(
      3 * (-p1.y + 3 * cp1.y - 3 * cp2.y + p2.y),
      6 * (p1.y - 2 * cp1.y + cp2.y),
      3 * (cp1.y - p1.y),
    )
    const tValues = [0, 1, ...dxRoots, ...dyRoots]
    for (const t of tValues) {
      const point = this.getPoint(t)
      min.x = Math.min(min.x, point.x)
      min.y = Math.min(min.y, point.y)
      max.x = Math.max(max.x, point.x)
      max.y = Math.max(max.y, point.y)
    }
    return { min: min.finite(), max: max.finite() }
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

  override copyFrom(source: CubicBezierCurve): this {
    super.copyFrom(source)
    this.p1.copyFrom(source.p1)
    this.cp1.copyFrom(source.cp1)
    this.cp2.copyFrom(source.cp2)
    this.p2.copyFrom(source.p2)
    return this
  }
}
