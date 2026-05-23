import type { Transform2D } from '../math'
import type { Path2DCommand } from '../types'
import type {
  FillTriangulateOptions,
  StrokeTriangulatedResult,
  StrokeTriangulateOptions,
} from '../utils'
import { Curve } from '../core/Curve'
import { BoundingBox, Vector2 } from '../math'
import { LineCurve } from './LineCurve'

export class CompositeCurve<T extends Curve = Curve> extends Curve {
  protected _adaptiveCacheLen = -1

  constructor(
    public curves: T[] = [],
  ) {
    super()
  }

  override invalidate(): this {
    super.invalidate()
    this._adaptiveCacheLen = -1
    this.curves.forEach(curve => curve.invalidate())
    return this
  }

  protected override _getCachedAdaptiveVertices(): number[] {
    // Also recompute when the number of sub-curves changes (e.g. while building),
    // not just on explicit invalidate().
    if (!this._adaptiveCache || this._adaptiveCacheLen !== this.curves.length) {
      this._adaptiveCache = this.getAdaptiveVertices()
      this._adaptiveCacheLen = this.curves.length
    }
    return this._adaptiveCache
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
    const n = lengths.length
    if (n === 0)
      return output
    // Binary search for the first cumulative length >= d.
    let lo = 0
    let hi = n - 1
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (lengths[mid] < d) {
        lo = mid + 1
      }
      else {
        hi = mid
      }
    }
    const diff = lengths[lo] - d
    const curve = this.curves[lo]
    const length = curve.getLength()
    return curve.getPointAt(
      length === 0
        ? 0
        : 1 - diff / length,
      output,
    )
  }

  override getLengths(): number[] {
    if (this._lengths.length !== this.curves.length) {
      this.updateLengths()
    }
    return this._lengths!
  }

  override updateLengths(): void {
    const lengths = []
    for (
      let i = 0,
        sum = 0,
        len = this.curves.length;
      i < len;
      i++
    ) {
      sum += this.curves[i].getLength()
      lengths.push(sum)
    }
    this._lengths = lengths
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

  override applyTransform(transform: Transform2D | ((point: Vector2) => void)): this {
    this.curves.forEach(curve => curve.applyTransform(transform))
    this.invalidate()
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

  override copyFrom(source: CompositeCurve<T>): this {
    super.copyFrom(source)
    this.curves = source.curves.map(curve => curve.clone())
    return this
  }
}
