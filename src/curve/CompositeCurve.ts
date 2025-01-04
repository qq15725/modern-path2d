import type { Path2DCommand } from '../core'
import { BoundingBox, Vector2 } from '../math'
import { Curve } from './Curve'

export class CompositeCurve<T extends Curve = Curve> extends Curve {
  protected _cacheLengths: number[] = []

  constructor(
    public curves: T[] = [],
  ) {
    super()
  }

  addCurve(curve: T): this {
    this.curves.push(curve)
    return this
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const d = t * this.getLength()
    const curveLengths = this.getCurveLengths()
    let i = 0
    while (i < curveLengths.length) {
      if (curveLengths[i] >= d) {
        const diff = curveLengths[i] - d
        const curve = this.curves[i]
        const segmentLength = curve.getLength()
        return curve.getPointAt(
          segmentLength === 0
            ? 0
            : 1 - diff / segmentLength,
          output,
        )
      }
      i++
    }
    return output
  }

  override getLength(): number {
    const lengths = this.getCurveLengths()
    return lengths[lengths.length - 1]
  }

  override updateLengths(): void {
    super.updateLengths()
    this._cacheLengths = []
    this.getCurveLengths()
  }

  getCurveLengths(): number[] {
    if (this._cacheLengths.length === this.curves.length) {
      return this._cacheLengths
    }
    const lengths = []
    let sums = 0
    for (let i = 0, l = this.curves.length; i < l; i++) {
      sums += this.curves[i].getLength()
      lengths.push(sums)
    }
    this._cacheLengths = lengths
    return lengths
  }

  override getControlPointRefs(): Vector2[] {
    return this.curves.flatMap(curve => curve.getControlPointRefs())
  }

  override getAdaptivePoints(): number[] {
    return this.curves.flatMap(curve => curve.getAdaptivePoints())
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    this.curves.forEach(curve => curve.getMinMax(min, max))
    return { min, max }
  }

  getBoundingBox(): BoundingBox {
    const { min, max } = this.getMinMax()
    return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
  }

  override toCommands(): Path2DCommand[] {
    return this.curves.flatMap(curve => curve.toCommands())
  }

  override drawTo(ctx: CanvasRenderingContext2D): this {
    const point = this.curves[0]?.getPoint(0)
    if (point) {
      ctx.moveTo(point.x, point.y)
    }
    this.curves.forEach(curve => curve.drawTo(ctx))
    return this
  }
}
