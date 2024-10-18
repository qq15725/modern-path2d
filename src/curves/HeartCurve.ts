import type { PathCommand } from '../types'
import { Vector2 } from '../math'
import { CircleCurve } from './CircleCurve'
import { Curve } from './Curve'
import { LineCurve } from './LineCurve'

export class HeartCurve extends Curve {
  declare curves: (CircleCurve | LineCurve)[]
  curveT = 0

  constructor(
    public center: Vector2,
    public size: number,
    public start = 0,
    public end = 1,
  ) {
    super()
    this.update()
  }

  update(): this {
    const { x, y } = this.center
    const A = new Vector2(x + 0.5 * this.size, y - 0.5 * this.size)
    const t = new Vector2(x - 0.5 * this.size, y - 0.5 * this.size)
    const i = new Vector2(x, y + 0.5 * this.size)
    const curve1 = new CircleCurve(A, Math.SQRT1_2 * this.size, -0.25 * Math.PI, 0.75 * Math.PI)
    const curve5 = new CircleCurve(t, Math.SQRT1_2 * this.size, -0.75 * Math.PI, 0.25 * Math.PI)
    const curve3 = new CircleCurve(i, 0.5 * Math.SQRT1_2 * this.size, 0.75 * Math.PI, 1.25 * Math.PI)
    const e = new Vector2(x, y + this.size)
    const l = new Vector2(x + this.size, y)
    const c = new Vector2().lerpVectors(l, e, 0.75)
    const h = new Vector2(x - this.size, y)
    const a = new Vector2().lerpVectors(h, e, 0.75)
    const curve2 = new LineCurve(l, c)
    const curve4 = new LineCurve(a, h)
    this.curves = [curve1, curve2, curve3, curve4, curve5]
    return this
  }

  override getPoint(t: number): Vector2 {
    return this.getCurve(t).getPoint(this.curveT)
  }

  override getPointAt(t: number): Vector2 {
    return this.getPoint(t)
  }

  getCurve(t: number): CircleCurve | LineCurve {
    let val = (t * (this.end - this.start) + this.start) % 1
    val < 0 && (val += 1)
    val *= (9 * Math.PI) / 8 + 1.5
    let index
    const PI_1_2 = 0.5 * Math.PI
    if (val < PI_1_2) {
      index = 0
      this.curveT = val / PI_1_2
    }
    else if (val < PI_1_2 + 0.75) {
      index = 1
      this.curveT = (val - PI_1_2) / 0.75
    }
    else if (val < (5 * Math.PI) / 8 + 0.75) {
      index = 2
      this.curveT = (val - PI_1_2 - 0.75) / (Math.PI / 8)
    }
    else if (val < (5 * Math.PI) / 8 + 1.5) {
      index = 3
      this.curveT = (val - (5 * Math.PI) / 8 - 0.75) / 0.75
    }
    else {
      index = 4
      this.curveT = (val - (5 * Math.PI) / 8 - 1.5) / PI_1_2
    }
    return this.curves[index]
  }

  override getTangent(t: number): Vector2 {
    return this.getCurve(t).getTangent(this.curveT)
  }

  getNormal(t: number): Vector2 {
    return this.getCurve(t).getNormal(this.curveT)
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
