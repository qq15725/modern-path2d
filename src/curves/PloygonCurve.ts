import type { PathCommand } from '../types'
import { Vector2 } from '../math'
import { Curve } from './Curve'
import { LineCurve } from './LineCurve'

export class PloygonCurve extends Curve {
  curves: LineCurve[] = []
  curveT = 0
  points: Vector2[] = []

  constructor(
    public center: Vector2,
    public radius = 0,
    public number = 0,
    public start = 0,
    public end = 1,
  ) {
    super()
    this.update()
  }

  update(): this {
    for (let i = 0; i < this.number; i++) {
      let radian = (i * 2 * Math.PI) / this.number
      radian -= 0.5 * Math.PI
      this.points.push(
        new Vector2(
          this.radius * Math.cos(radian),
          this.radius * Math.sin(radian),
        )
          .add(this.center),
      )
    }
    for (let i = 0; i < this.number; i++) {
      this.curves.push(new LineCurve(this.points[i], this.points[(i + 1) % this.number]))
    }
    return this
  }

  getCurve(t: number): LineCurve {
    let pos = (t * (this.end - this.start) + this.start) % 1
    pos < 0 && (pos += 1)
    const v = pos * this.number
    const index = Math.floor(v)
    this.curveT = v - index
    return this.curves[index]
  }

  override getPoint(t: number, output?: Vector2): Vector2 {
    return this.getCurve(t).getPoint(this.curveT, output)
  }

  override getPointAt(u: number, output?: Vector2): Vector2 {
    return this.getPoint(u, output)
  }

  override getTangent(t: number, output?: Vector2): Vector2 {
    return this.getCurve(t).getTangent(this.curveT, output)
  }

  getNormal(t: number, output?: Vector2): Vector2 {
    return this.getCurve(t).getNormal(this.curveT, output)
  }

  override transformPoint(cb: (point: Vector2) => void): this {
    this.curves.forEach(curve => curve.transformPoint(cb))
    return this
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    this.curves.forEach(curve => curve.getMinMax(min, max))
    return { min, max }
  }

  override getCommands(): PathCommand[] {
    return this.curves.flatMap(curve => curve.getCommands())
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    this.curves.forEach(curve => curve.drawTo(ctx))
    return this
  }
}
