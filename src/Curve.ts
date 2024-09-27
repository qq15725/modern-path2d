import type { PathCommand } from './types'
import { Point2D } from './Point2D'

export abstract class Curve {
  arcLengthDivisions = 200
  protected _cacheArcLengths?: number[]
  protected _needsUpdate = false

  abstract getPoint(t: number, output?: Point2D): Point2D
  abstract getPathCommands(): PathCommand[]
  abstract drawTo(ctx: CanvasRenderingContext2D): void

  getMinMax(min = Point2D.MAX, max = Point2D.MIN): { min: Point2D, max: Point2D } {
    return { min, max }
  }

  getDivisions(divisions: number): number {
    return divisions
  }

  getPointAt(u: number, output = new Point2D()): Point2D {
    return this.getPoint(this.getUtoTmapping(u), output)
  }

  getPoints(divisions = 5): Point2D[] {
    const points: Point2D[] = []
    for (let i = 0; i <= divisions; i++) {
      points.push(this.getPoint(i / divisions))
    }
    return points
  }

  getSpacedPoints(divisions = 5): Point2D[] {
    const points: Point2D[] = []
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

  getPathData(): string {
    return this.getPathCommands().map((cmd) => {
      switch (cmd.type) {
        case 'M':
          return `M ${cmd.x} ${cmd.y}`
        case 'L':
          return `L ${cmd.x} ${cmd.y}`
        case 'C':
          return `C ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`
        case 'Q':
          return `Q ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`
        case 'A':
          return `A ${cmd.rx} ${cmd.ry} ${cmd.xAxisRotation} ${cmd.largeArcFlag} ${cmd.sweepFlag} ${cmd.x} ${cmd.y}`
        case 'Z':
          return 'Z'
        default:
          return ''
      }
    }).join(' ')
  }

  clone(): this {
    return new (this.constructor as any)().copy(this)
  }

  copy(source: Curve): this {
    this.arcLengthDivisions = source.arcLengthDivisions
    return this
  }
}
