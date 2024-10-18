import type { Matrix3 } from '../math'
import type { PathCommand } from '../types'
import { BoundingBox, Vector2 } from '../math'
import { pathCommandsToPathData } from '../svg'

export abstract class Curve {
  arcLengthDivisions = 200
  protected _cacheArcLengths?: number[]
  protected _needsUpdate = false

  abstract getPoint(t: number, output?: Vector2): Vector2

  getPointAt(u: number, output = new Vector2()): Vector2 {
    return this.getPoint(this.getUtoTmapping(u), output)
  }

  getPoints(divisions = 5): Vector2[] {
    const points: Vector2[] = []
    for (let i = 0; i <= divisions; i++) {
      points.push(this.getPoint(i / divisions))
    }
    return points
  }

  getSpacedPoints(divisions = 5): Vector2[] {
    const points: Vector2[] = []
    for (let i = 0; i <= divisions; i++) {
      points.push(this.getPointAt(i / divisions))
    }
    return points
  }

  getLength(): number {
    const lengths = this.getLengths()
    return lengths[lengths.length - 1]
  }

  getLengths(divisions = this.arcLengthDivisions): number[] {
    if (
      this._cacheArcLengths
      && (this._cacheArcLengths.length === divisions + 1)
      && !this._needsUpdate
    ) {
      return this._cacheArcLengths
    }
    this._needsUpdate = false
    const cache = []
    let current
    let last = this.getPoint(0)
    let sum = 0
    cache.push(0)
    for (let i = 1; i <= divisions; i++) {
      current = this.getPoint(i / divisions)
      sum += current.distanceTo(last)
      cache.push(sum)
      last = current
    }
    this._cacheArcLengths = cache
    return cache
  }

  updateArcLengths(): void {
    this._needsUpdate = true
    this.getLengths()
  }

  getUtoTmapping(u: number, distance?: number): number {
    const arcLengths = this.getLengths()
    let i = 0
    const il = arcLengths.length
    let targetArcLength
    if (distance) {
      targetArcLength = distance
    }
    else {
      targetArcLength = u * arcLengths[il - 1]
    }
    let low = 0
    let high = il - 1
    let comparison
    while (low <= high) {
      i = Math.floor(low + (high - low) / 2)
      comparison = arcLengths[i] - targetArcLength
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
    if (arcLengths[i] === targetArcLength) {
      return i / (il - 1)
    }
    const lengthBefore = arcLengths[i]
    const lengthAfter = arcLengths[i + 1]
    const segmentLength = lengthAfter - lengthBefore
    const segmentFraction = (targetArcLength - lengthBefore) / segmentLength
    return (i + segmentFraction) / (il - 1)
  }

  getTangent(t: number, output = new Vector2()): Vector2 {
    const delta = 0.0001
    const t1 = Math.max(0, t - delta)
    const t2 = Math.min(1, t + delta)
    return output.copy(this.getPoint(t2).sub(this.getPoint(t1)).normalize())
  }

  getTangentAt(u: number, output?: Vector2): Vector2 {
    return this.getTangent(this.getUtoTmapping(u), output)
  }

  /** overrideable */
  // eslint-disable-next-line unused-imports/no-unused-vars
  transformPoint(cb: (point: Vector2) => void): this {
    return this
  }

  transform(matrix: Matrix3): this {
    this.transformPoint(point => point.applyMatrix3(matrix))
    return this
  }

  getDivisions(divisions: number): number {
    return divisions
  }

  getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    this.getPoints().forEach((point) => {
      min.x = Math.min(min.x, point.x)
      min.y = Math.min(min.y, point.y)
      max.x = Math.max(max.x, point.x)
      max.y = Math.max(max.y, point.y)
    })
    return { min, max }
  }

  getBoundingBox(): BoundingBox {
    const { min, max } = this.getMinMax()
    return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
  }

  getCommands(): PathCommand[] {
    return this.getPoints().map((point, i) => {
      if (i === 0) {
        return { type: 'M', x: point.x, y: point.y }
      }
      else {
        return { type: 'L', x: point.x, y: point.y }
      }
    })
  }

  getData(): string {
    return pathCommandsToPathData(this.getCommands())
  }

  /** overrideable */
  // eslint-disable-next-line unused-imports/no-unused-vars
  drawTo(ctx: CanvasRenderingContext2D): this {
    return this
  }

  copy(source: Curve): this {
    this.arcLengthDivisions = source.arcLengthDivisions
    return this
  }

  clone(): this {
    return new (this.constructor as any)().copy(this)
  }
}
