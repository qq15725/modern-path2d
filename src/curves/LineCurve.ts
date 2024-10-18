import type { PathCommand } from '../types'
import { Vector2 } from '../math'
import { Curve } from './Curve'

export class LineCurve extends Curve {
  constructor(
    public start = new Vector2(),
    public end = new Vector2(),
  ) {
    super()
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    if (t === 1) {
      output.copy(this.end)
    }
    else {
      output
        .copy(this.end)
        .sub(this.start)
        .multiplyScalar(t)
        .add(this.start)
    }
    return output
  }

  override getPointAt(u: number, output = new Vector2()): Vector2 {
    return this.getPoint(u, output)
  }

  override getTangent(_t: number, output = new Vector2()): Vector2 {
    return output.subVectors(this.end, this.start).normalize()
  }

  override getTangentAt(u: number, output = new Vector2()): Vector2 {
    return this.getTangent(u, output)
  }

  getNormal(t: number, output = new Vector2()): Vector2 {
    const { x, y } = this.getPoint(t).sub(this.start)
    return output.set(y, -x).normalize()
  }

  override transformPoint(cb: (point: Vector2) => void): this {
    cb(this.start)
    cb(this.end)
    return this
  }

  override getDivisions(): number {
    return 1
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    const { start, end } = this
    min.x = Math.min(min.x, start.x, end.x)
    min.y = Math.min(min.y, start.y, end.y)
    max.x = Math.max(max.x, start.x, end.x)
    max.y = Math.max(max.y, start.y, end.y)
    return { min, max }
  }

  override getCommands(): PathCommand[] {
    const { start, end } = this
    return [
      { type: 'M', x: start.x, y: start.y },
      { type: 'L', x: end.x, y: end.y },
    ]
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const { end } = this
    ctx.lineTo(end.x, end.y)
    return this
  }

  override copy(source: LineCurve): this {
    super.copy(source)
    this.start.copy(source.start)
    this.end.copy(source.end)
    return this
  }
}
