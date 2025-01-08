import type { Path2DCommand } from '../core'
import type { Matrix3 } from '../math'
import { BoundingBox, Vector2 } from '../math'
import { Curve } from './Curve'

export class CompositeCurve<T extends Curve = Curve> extends Curve {
  constructor(
    public curves: T[] = [],
  ) {
    super()
  }

  getFlatCurves(): Curve[] {
    return this.curves.flatMap((curve) => {
      if (curve instanceof CompositeCurve) {
        return curve.getFlatCurves()
      }
      return curve
    })
  }

  addCurve(curve: T): this {
    this.curves.push(curve)
    return this
  }

  override getPoint(t: number, output = new Vector2()): Vector2 {
    const d = t * this.getLength()
    const lengths = this.getLengths()
    let i = 0
    while (i < lengths.length) {
      if (lengths[i] >= d) {
        const diff = lengths[i] - d
        const curve = this.curves[i]
        const length = curve.getLength()
        return curve.getPointAt(
          length === 0
            ? 0
            : 1 - diff / length,
          output,
        )
      }
      i++
    }
    return output
  }

  override updateLengths(): void {
    const arcLengths = []
    for (
      let i = 0,
        sum = 0,
        len = this.curves.length;
      i < len;
      i++
    ) {
      sum += this.curves[i].getLength()
      arcLengths.push(sum)
    }
    this._arcLengths = arcLengths
  }

  override getControlPointRefs(): Vector2[] {
    return this.curves.flatMap(curve => curve.getControlPointRefs())
  }

  override getAdaptivePointArray(output: number[] = []): number[] {
    let offset: number | undefined
    this.curves.forEach((curve) => {
      curve.getAdaptivePointArray(output)
      if (offset) {
        if (
          output[offset - 1] === output[offset + 1]
          && output[offset] === output[offset + 2]
        ) {
          output.splice(offset + 1, 2)
        }
      }
      offset = output.length - 1
    })
    return output
  }

  override applyTransform(transform: Matrix3): this {
    this.curves.forEach(curve => curve.applyTransform(transform))
    return this
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

  override copy(source: CompositeCurve<T>): this {
    super.copy(source)
    this.curves = source.curves.map(curve => curve.clone())
    return this
  }
}
