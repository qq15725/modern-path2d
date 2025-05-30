import type { Path2DCommand } from '../core'
import type { Matrix3 } from '../math'
import type {
  FillTriangulateOptions,
  StrokeTriangulatedResult,
  StrokeTriangulateOptions,
} from './utils'
import { BoundingBox, Vector2 } from '../math'
import { Curve } from './Curve'
import { LineCurve } from './LineCurve'

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

  protected _removeNextPointIfEqualPrevPoint(output: number[], offset: number): number[] {
    const p1 = [output[offset - 1], output[offset]]
    const p2 = [output[offset + 1], output[offset + 2]]
    if (p1[0] === p2[0] && p1[1] === p2[1]) {
      output.splice(offset + 1, 2)
    }
    return output
  }

  override getSpacedVertices(count = 5, output: number[] = []): number[] {
    let offset: number | undefined
    this.curves.forEach((curve) => {
      curve.getSpacedVertices(count, output)
      if (offset) {
        this._removeNextPointIfEqualPrevPoint(output, offset)
      }
      offset = output.length - 1
    })
    return output
  }

  override getAdaptiveVertices(output: number[] = []): number[] {
    let offset: number | undefined
    this.curves.forEach((curve) => {
      curve.getAdaptiveVertices(output)
      if (offset) {
        this._removeNextPointIfEqualPrevPoint(output, offset)
      }
      offset = output.length - 1
    })
    return output
  }

  override strokeTriangulate(options?: StrokeTriangulateOptions): StrokeTriangulatedResult {
    if (this.curves.length === 1) {
      return this.curves[0].strokeTriangulate(options)
    }
    else {
      return super.strokeTriangulate(options)
    }
  }

  override getFillVertices(options?: FillTriangulateOptions): number[] {
    if (this.curves.length === 1) {
      return this.curves[0].getFillVertices(options)
    }
    else {
      const output: number[] = []
      let offset: number | undefined
      this.curves.forEach((curve) => {
        let arr
        if (curve instanceof LineCurve) {
          arr = curve.getAdaptiveVertices()
        }
        else {
          arr = curve.getFillVertices(options)
        }
        output.push(...arr)
        if (offset) {
          this._removeNextPointIfEqualPrevPoint(output, offset)
        }
        offset = output.length - 1
      })
      return output
    }
  }

  override applyTransform(transform: Matrix3 | ((point: Vector2) => void)): this {
    this.curves.forEach(curve => curve.applyTransform(transform))
    return this
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    this.curves.forEach(curve => curve.getMinMax(min, max))
    return { min: min.finite(), max: max.finite() }
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
