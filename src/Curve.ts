import type { PathCommand } from './types'
import { Point2D } from './Point2D'

export class Curve {
  arcLengthDivisions = 200
  protected _cacheArcLengths?: number[]
  protected _needsUpdate = false

  getPoint(t: number, output = new Point2D()): Point2D {
    console.warn('getPoint not implemented', t)
    return output
  }

  getPointAt(u: number, output = new Point2D()): Point2D {
    return this.getPoint(this.getUtoTmapping(u), output)
  }

  getPoints(divisions = 5): Point2D[] {
    const points: Point2D[] = []
    for (let d = 0; d <= divisions; d++) {
      points.push(this.getPoint(d / divisions))
    }
    return points
  }

  getDivisions(divisions: number): number {
    return divisions
  }

  getSpacedPoints(divisions = 5): Point2D[] {
    const points: Point2D[] = []
    for (let d = 0; d <= divisions; d++) {
      points.push(this.getPointAt(d / divisions))
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
    for (let p = 1; p <= divisions; p++) {
      current = this.getPoint(p / divisions)
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

  getTangent(t: number, output = new Point2D()): Point2D {
    const delta = 0.0001
    let t1 = t - delta
    let t2 = t + delta
    if (t1 < 0)
      t1 = 0
    if (t2 > 1)
      t2 = 1
    return output.copy(this.getPoint(t2)).sub(this.getPoint(t1)).normalize()
  }

  getTangentAt(u: number, output = new Point2D()): Point2D {
    return this.getTangent(this.getUtoTmapping(u), output)
  }

  toPathCommands(): PathCommand[] {
    return []
  }

  clone(): this {
    return new (this.constructor as any)().copy(this)
  }

  copy(source: Curve): this {
    this.arcLengthDivisions = source.arcLengthDivisions
    return this
  }
}
