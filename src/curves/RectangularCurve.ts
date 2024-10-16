import type { PathCommand } from '../svg'
import { Vector2 } from '../math'
import { Curve } from './Curve'
import { LineCurve } from './LineCurve'

export class RectangularCurve extends Curve {
  curves: LineCurve[] = []
  curveT = 0

  get x(): number { return this.center.x - this.rx }
  get y(): number { return this.center.y - this.rx / this.aspectRatio }
  get width(): number { return this.rx * 2 }
  get height(): number { return (this.rx / this.aspectRatio) * 2 }

  constructor(
    public center: Vector2,
    public rx: number,
    public aspectRatio = 1,
    public start = 0,
    public end = 1,
  ) {
    super()
    this.update()
  }

  update(): this {
    const { x, y } = this.center
    const offsetX = this.rx
    const offsetY = this.rx / this.aspectRatio
    const points: Vector2[] = [
      new Vector2(x - offsetX, y - offsetY),
      new Vector2(x + offsetX, y - offsetY),
      new Vector2(x + offsetX, y + offsetY),
      new Vector2(x - offsetX, y + offsetY),
    ]
    for (let i = 0; i < 4; i++) {
      this.curves.push(new LineCurve(points[i].clone(), points[(i + 1) % 4].clone()))
    }
    return this
  }

  getCurve(t: number): LineCurve {
    let current = (t * (this.end - this.start) + this.start) % 1
    current < 0 && (current += 1)
    current *= (1 + this.aspectRatio) * 2
    let i
    if (current < this.aspectRatio) {
      i = 0
      this.curveT = current / this.aspectRatio
    }
    else if (current < this.aspectRatio + 1) {
      i = 1
      this.curveT = (current - this.aspectRatio) / 1
    }
    else if (current < 2 * this.aspectRatio + 1) {
      i = 2
      this.curveT = (current - this.aspectRatio - 1) / this.aspectRatio
    }
    else {
      i = 3
      this.curveT = (current - 2 * this.aspectRatio - 1) / 1
    }
    return this.curves[i]
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
