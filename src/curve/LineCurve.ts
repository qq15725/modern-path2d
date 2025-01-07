import type { Path2DCommand } from '../core'
import { Vector2 } from '../math'
import { Curve } from './Curve'

export class LineCurve extends Curve {
  static from(
    p1x: number, p1y: number,
    p2x: number, p2y: number,
  ): LineCurve {
    return new LineCurve(
      new Vector2(p1x, p1y),
      new Vector2(p2x, p2y),
    )
  }

  constructor(
    public p1: Vector2,
    public p2: Vector2,
  ) {
    super()
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    if (t === 1) {
      output.copy(this.p2)
    }
    else {
      output
        .copy(this.p2)
        .sub(this.p1)
        .scale(t)
        .add(this.p1)
    }
    return output
  }

  override getPointAt(u: number, output = new Vector2()): Vector2 {
    return this.getPoint(u, output)
  }

  override getTangent(_t: number, output = new Vector2()): Vector2 {
    return output.subVectors(this.p2, this.p1).normalize()
  }

  override getTangentAt(u: number, output = new Vector2()): Vector2 {
    return this.getTangent(u, output)
  }

  override getControlPointRefs(): Vector2[] {
    return [this.p1, this.p2]
  }

  override getAdaptivePointArray(output: number[] = []): number[] {
    output.push(
      this.p1.x, this.p1.y,
      this.p2.x, this.p2.y,
    )
    return output
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    const { p1, p2 } = this
    min.x = Math.min(min.x, p1.x, p2.x)
    min.y = Math.min(min.y, p1.y, p2.y)
    max.x = Math.max(max.x, p1.x, p2.x)
    max.y = Math.max(max.y, p1.y, p2.y)
    return { min, max }
  }

  override toCommands(): Path2DCommand[] {
    const { p1, p2 } = this
    return [
      { type: 'M', x: p1.x, y: p1.y },
      { type: 'L', x: p2.x, y: p2.y },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { p1, p2 } = this
    ctx.lineTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    return this
  }

  override copy(source: LineCurve): this {
    super.copy(source)
    this.p1.copy(source.p1)
    this.p2.copy(source.p2)
    return this
  }
}
