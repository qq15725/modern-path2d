import type { Matrix3 } from '../math'
import type { PathCommand } from '../svg'
import { Point2D } from '../math'
import { Curve } from './Curve'

export class LineCurve extends Curve {
  constructor(
    public v1 = new Point2D(),
    public v2 = new Point2D(),
  ) {
    super()
  }

  override getDivisions(): number {
    return 1
  }

  override getPoint(t: number, output = new Point2D()): Point2D {
    if (t === 1) {
      output.copy(this.v2)
    }
    else {
      output.copy(this.v2).sub(this.v1)
      output.multiplyScalar(t).add(this.v1)
    }
    return output
  }

  override getPointAt(u: number, output = new Point2D()): Point2D {
    return this.getPoint(u, output)
  }

  override getTangent(t: number, output = new Point2D()): Point2D {
    return output.subVectors(this.v2, this.v1).normalize()
  }

  override getTangentAt(u: number, output = new Point2D()): Point2D {
    return this.getTangent(u, output)
  }

  override getCommands(): PathCommand[] {
    const { v1, v2 } = this
    return [
      { type: 'M', x: v1.x, y: v1.y },
      { type: 'L', x: v2.x, y: v2.y },
    ]
  }

  override getMinMax(min = Point2D.MAX, max = Point2D.MIN): { min: Point2D, max: Point2D } {
    const { v1, v2 } = this
    min.x = Math.min(min.x, v1.x, v2.x)
    min.y = Math.min(min.y, v1.y, v2.y)
    max.x = Math.max(max.x, v1.x, v2.x)
    max.y = Math.max(max.y, v1.y, v2.y)
    return { min, max }
  }

  override transform(matrix: Matrix3): this {
    this.v1.applyMatrix3(matrix)
    this.v2.applyMatrix3(matrix)
    return this
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { v1, v2 } = this
    ctx.moveTo(v1.x, v1.y)
    ctx.lineTo(v2.x, v2.y)
    return this
  }

  override copy(source: LineCurve): this {
    super.copy(source)
    this.v1.copy(source.v1)
    this.v2.copy(source.v2)
    return this
  }
}
