import type { Path2DCommand, Path2DData } from '../core'
import type { Matrix3, VectorLike } from '../math'
import type {
  FillTriangulateOptions,
  FillTriangulateResult,
  StrokeTriangulateOptions,
  StrokeTriangulateResult,
} from './utils'
import { BoundingBox, Vector2 } from '../math'
import { svgPathCommandsToData } from '../svg'
import { fillTriangulate, strokeTriangulate } from './utils'

export abstract class Curve {
  arcLengthDivision = 200
  protected _arcLengths?: number[]

  abstract getPoint(t: number, output?: Vector2): Vector2

  getPointAt(u: number, output = new Vector2()): Vector2 {
    return this.getPoint(this.getUToTMapping(u), output)
  }

  isClockwise(): boolean {
    const prev = this.getPoint(1)
    const cur = this.getPoint(0.5)
    const next = this.getPoint(1)
    return (
      (cur.x - prev.x) * (next.y - cur.y)
      - (cur.y - prev.y) * (next.x - cur.x)
    ) < 0
  }

  getControlPointRefs(): Vector2[] {
    return []
  }

  applyTransform(transform: Matrix3): this {
    this.getControlPointRefs().forEach((p) => {
      p.applyMatrix3(transform)
    })
    return this
  }

  getUnevenPointArray(count = 5, output: number[] = []): number[] {
    const p = new Vector2()
    for (let i = 0, len = Math.max(1, count) - 1; i <= len; i++) {
      this.getPoint(i / len, p)
      output.push(p.x, p.y)
    }
    return output
  }

  getSpacedPointArray(count = 5, output: number[] = []): number[] {
    const p = new Vector2()
    for (let i = 0, len = Math.max(1, count) - 1; i <= len; i++) {
      this.getPointAt(i / len, p)
      output.push(p.x, p.y)
    }
    return output
  }

  getAdaptivePointArray(output: number[] = []): number[] {
    return this.getUnevenPointArray(5, output)
  }

  protected _pointArrayToPoint(array: number[], output: Vector2[] = []): Vector2[] {
    for (let i = 0, len = array.length; i < len; i += 2) {
      const x = array[i]
      const y = array[i + 1]
      output.push(new Vector2(x, y))
    }
    return output
  }

  getSpacedPoints(count?: number, output: Vector2[] = []): Vector2[] {
    const array = this.getSpacedPointArray(count)
    this._pointArrayToPoint(array, output)
    return output
  }

  getUnevenPoints(count?: number, output: Vector2[] = []): Vector2[] {
    const array = this.getUnevenPointArray(count)
    this._pointArrayToPoint(array, output)
    return output
  }

  getAdaptivePoints(output: Vector2[] = []): Vector2[] {
    const array = this.getAdaptivePointArray()
    this._pointArrayToPoint(array, output)
    return output
  }

  getPoints(count?: number, output: Vector2[] = []): Vector2[] {
    let array
    if (count) {
      array = this.getUnevenPointArray(count)
    }
    else {
      array = this.getAdaptivePointArray()
    }
    this._pointArrayToPoint(array, output)
    return output
  }

  getLength(): number {
    const lengths = this.getLengths()
    return lengths[lengths.length - 1]
  }

  getLengths(): number[] {
    if (
      !this._arcLengths
      || (this._arcLengths.length !== this.arcLengthDivision + 1)
    ) {
      this.updateLengths()
    }
    return this._arcLengths!
  }

  updateLengths(): void {
    const divisions = this.arcLengthDivision
    const arcLengths = [0]
    for (
      let sum = 0,
        prev = this.getPoint(0),
        i = 1;
      i <= divisions;
      i++
    ) {
      const current = this.getPoint(i / divisions)
      sum += current.distanceTo(prev)
      arcLengths.push(sum)
      prev = current
    }
    this._arcLengths = arcLengths
  }

  getUToTMapping(u: number, distance?: number): number {
    const lengths = this.getLengths()
    const lengthsLen = lengths.length
    const targetLen = distance ?? u * lengths[lengthsLen - 1]
    if (lengthsLen < 2) {
      return targetLen / lengths[0]
    }
    let i = 0
    let low = 0
    let high = lengthsLen - 1
    let comparison
    while (low <= high) {
      i = Math.floor(low + (high - low) / 2)
      comparison = lengths[i] - targetLen
      if (comparison < 0) {
        low = i + 1
      }
      else if (comparison > 0) {
        high = i - 1
      }
      else {
        high = i
        break
      }
    }
    i = high
    if (lengths[i] === targetLen) {
      return i / (lengthsLen - 1)
    }
    const before = lengths[i]
    const after = lengths[i + 1]
    const segmentLength = after - before
    const segmentFraction = (targetLen - before) / segmentLength
    return (i + segmentFraction) / (lengthsLen - 1)
  }

  getTangent(t: number, output = new Vector2()): Vector2 {
    const delta = 0.0001
    const t1 = Math.max(0, t - delta)
    const t2 = Math.min(1, t + delta)
    return output.copy(this.getPoint(t2).sub(this.getPoint(t1)).normalize())
  }

  getTangentAt(u: number, output?: Vector2): Vector2 {
    return this.getTangent(this.getUToTMapping(u), output)
  }

  getNormal(t: number, output = new Vector2()): Vector2 {
    this.getTangent(t, output)
    return output.set(-output.y, output.x).normalize()
  }

  getNormalAt(u: number, output?: Vector2): Vector2 {
    return this.getNormal(this.getUToTMapping(u), output)
  }

  getTForPoint(target: VectorLike, epsilon = 0.001): number {
    let low = 0
    let high = 1
    let mid = (low + high) / 2
    while ((high - low) > epsilon) {
      mid = (low + high) / 2
      const point = this.getPoint(mid)
      const distance = point.distanceTo(target)
      if (distance < epsilon) {
        return mid
      }
      if (point.x < target.x) {
        low = mid
      }
      else {
        high = mid
      }
    }
    return mid
  }

  getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    const potins = this.getPoints()
    for (let i = 0, len = potins.length; i < len; i++) {
      const p = potins[i]
      min.min(p)
      max.max(p)
    }
    return { min, max }
  }

  getBoundingBox(): BoundingBox {
    const { min, max } = this.getMinMax()
    return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
  }

  fillTriangulate(options?: FillTriangulateOptions): FillTriangulateResult {
    return fillTriangulate(
      this.getPoints().reduce((arr, p) => {
        arr.push(p.x, p.y)
        return arr
      }, [] as number[]),
      options,
    )
  }

  strokeTriangulate(options?: StrokeTriangulateOptions): StrokeTriangulateResult {
    return strokeTriangulate(
      this.getPoints().reduce((arr, p) => {
        arr.push(p.x, p.y)
        return arr
      }, [] as number[]),
      options,
    )
  }

  toCommands(): Path2DCommand[] {
    const comds: Path2DCommand[] = []
    const potins = this.getPoints()
    for (let i = 0, len = potins.length; i < len; i++) {
      const p = potins[i]
      if (i === 0) {
        comds.push({ type: 'M', x: p.x, y: p.y })
      }
      else {
        comds.push({ type: 'L', x: p.x, y: p.y })
      }
    }
    return comds
  }

  toData(): Path2DData {
    return svgPathCommandsToData(this.toCommands())
  }

  drawTo(ctx: CanvasRenderingContext2D): this {
    this.toCommands().forEach((cmd) => {
      switch (cmd.type) {
        case 'M':
          ctx.moveTo(cmd.x, cmd.y)
          break
        case 'L':
          ctx.lineTo(cmd.x, cmd.y)
          break
      }
    })
    return this
  }

  copy(source: Curve): this {
    this.arcLengthDivision = source.arcLengthDivision
    return this
  }

  clone(): this {
    return new (this.constructor as any)().copy(this)
  }
}
