import type { Path2DCommand } from '../types'
import { Curve } from '../core/Curve'
import { Vector2 } from '../math'
import { getAdaptiveQuadraticBezierCurvePoints, quadraticBezier } from '../utils'

export class QuadraticBezierCurve extends Curve {
  static from(
    p1x: number, p1y: number,
    cpx: number, cpy: number,
    p2x: number, p2y: number,
  ): QuadraticBezierCurve {
    return new QuadraticBezierCurve(
      new Vector2(p1x, p1y),
      new Vector2(cpx, cpy),
      new Vector2(p2x, p2y),
    )
  }

  constructor(
    public p1 = new Vector2(),
    public cp = new Vector2(),
    public p2 = new Vector2(),
  ) {
    super()
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const { p1, cp, p2 } = this
    output.set(
      quadraticBezier(t, p1.x, cp.x, p2.x),
      quadraticBezier(t, p1.y, cp.y, p2.y),
    )
    return output
  }

  override getControlPointRefs(): Vector2[] {
    return [this.p1, this.cp, this.p2]
  }

  override getAdaptiveVertices(output: number[] = []): number[] {
    return getAdaptiveQuadraticBezierCurvePoints(
      this.p1.x, this.p1.y,
      this.cp.x, this.cp.y,
      this.p2.x, this.p2.y,
      0.5,
      output,
    )
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    const { p1, cp, p2 } = this
    const x1 = 0.5 * (p1.x + cp.x)
    const y1 = 0.5 * (p1.y + cp.y)
    const x2 = 0.5 * (p1.x + p2.x)
    const y2 = 0.5 * (p1.y + p2.y)
    min.x = Math.min(min.x, p1.x, p2.x, x1, x2)
    min.y = Math.min(min.y, p1.y, p2.y, y1, y2)
    max.x = Math.max(max.x, p1.x, p2.x, x1, x2)
    max.y = Math.max(max.y, p1.y, p2.y, y1, y2)
    return { min: min.finite(), max: max.finite() }
  }

  override toCommands(): Path2DCommand[] {
    const { p1, cp, p2 } = this
    return [
      { type: 'M', x: p1.x, y: p1.y },
      { type: 'Q', x1: cp.x, y1: cp.y, x: p2.x, y: p2.y },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { p1, cp, p2 } = this
    ctx.lineTo(p1.x, p1.y)
    ctx.quadraticCurveTo(cp.x, cp.y, p2.x, p2.y)
    return this
  }

  override copy(source: QuadraticBezierCurve): this {
    super.copy(source)
    this.p1.copy(source.p1)
    this.cp.copy(source.cp)
    this.p2.copy(source.p2)
    return this
  }
}
