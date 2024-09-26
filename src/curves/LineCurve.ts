import type { PathCommand } from '../types'
import { Curve } from '../Curve'
import { Point2D } from '../Point2D'

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

  override toPathCommands(): PathCommand[] {
    return [
      { type: 'M', x: this.v1.x, y: this.v1.y },
      { type: 'L', x: this.v2.x, y: this.v2.y },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): void {
    const { v1, v2 } = this
    ctx.moveTo(v1.x, v1.y)
    ctx.lineTo(v2.x, v2.y)
  }

  override copy(source: LineCurve): this {
    super.copy(source)
    this.v1.copy(source.v1)
    this.v2.copy(source.v2)
    return this
  }
}
