import type { Path2DCommand, Path2DData } from '../core'
import type { Matrix3, VectorLike } from '../math'
import type { FillTriangulateOptions, StrokeTriangulateOptions } from './utils'
import { BoundingBox, Vector2 } from '../math'
import { svgPathCommandsToData } from '../svg'
import { fillTriangulate, strokeTriangulate } from './utils'

export abstract class Curve {
  startT = 0
  endT = 1
  arcLengthDivisions = 200
  protected _cacheArcLengths?: number[]
  protected _needsUpdate = false

  isClockwise(): boolean {
    const prev = this.getPoint(1)
    const cur = this.getPoint(0.5)
    const next = this.getPoint(1)
    return (
      (cur.x - prev.x) * (next.y - cur.y)
      - (cur.y - prev.y) * (next.x - cur.x)
    ) < 0
  }

  abstract getPoint(t: number, output?: Vector2): Vector2

  getPointAt(u: number, output = new Vector2()): Vector2 {
    return this.getPoint(this.getUToTMapping(u), output)
  }

  getControlPointRefs(): Vector2[] {
    return []
  }

  getUnevenPoints(count = 5, output: number[] = []): number[] {
    count = Math.max(1, count)
    const point = new Vector2()
    for (let i = 0, len = count - 1; i <= len; i++) {
      this.getPoint(i / len, point)
      output.push(point.x, point.y)
    }
    return output
  }

  getSpacedPoints(count = 5, output: number[] = []): number[] {
    count = Math.max(1, count)
    const point = new Vector2()
    for (let i = 0, len = count - 1; i <= len; i++) {
      this.getPointAt(i / len, point)
      output.push(point.x, point.y)
    }
    return output
  }

  getAdaptivePoints(output: number[] = []): number[] {
    return this.getUnevenPoints(5, output)
  }

  getPoints(count?: number, output: number[] = []): number[] {
    if (count) {
      return this.getUnevenPoints(count, output)
    }
    else {
      return this.getAdaptivePoints(output)
    }
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
    let prev = this.getPoint(0)
    let sum = 0
    cache.push(0)
    for (let i = 1; i <= divisions; i++) {
      current = this.getPoint(i / divisions)
      sum += current.distanceTo(prev)
      cache.push(sum)
      prev = current
    }
    this._cacheArcLengths = cache
    return cache
  }

  updateLengths(): void {
    this._needsUpdate = true
    this.getLengths()
  }

  getUToTMapping(u: number, distance?: number): number {
    const lengths = this.getLengths()
    let i = 0
    const lengthsLen = lengths.length
    let targetLength
    if (distance) {
      targetLength = distance
    }
    else {
      targetLength = u * lengths[lengthsLen - 1]
    }
    let low = 0
    let high = lengthsLen - 1
    let comparison
    while (low <= high) {
      i = Math.floor(low + (high - low) / 2)
      comparison = lengths[i] - targetLength
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
    if (lengths[i] === targetLength) {
      return i / (lengthsLen - 1)
    }
    const lengthBefore = lengths[i]
    const lengthAfter = lengths[i + 1]
    const segmentLength = lengthAfter - lengthBefore
    const segmentFraction = (targetLength - lengthBefore) / segmentLength
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

  matrix(matrix: Matrix3): this {
    this.getControlPointRefs().forEach(point => point.applyMatrix3(matrix))
    return this
  }

  getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    const potins = this.getPoints()
    for (let i = 0, len = potins.length; i < len; i += 2) {
      const p = { x: potins[i], y: potins[i + 1] }
      min.min(p)
      max.max(p)
    }
    return { min, max }
  }

  getBoundingBox(): BoundingBox {
    const { min, max } = this.getMinMax()
    return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
  }

  fillTriangulate(
    vertices: number[],
    indices: number[],
    options: FillTriangulateOptions = {},
  ): void {
    fillTriangulate(
      this.getPoints(),
      vertices,
      indices,
      options,
    )
  }

  strokeTriangulate(
    vertices: number[],
    indices: number[],
    options: StrokeTriangulateOptions = {},
  ): void {
    strokeTriangulate(
      this.getPoints(),
      vertices,
      indices,
      options,
    )
  }

  toCommands(): Path2DCommand[] {
    const comds: Path2DCommand[] = []
    const potins = this.getPoints()
    for (let i = 0, len = potins.length; i < len; i += 2) {
      const p = { x: potins[i], y: potins[i + 1] }
      if (i === 0) {
        comds.push({ type: 'M', ...p })
      }
      else {
        comds.push({ type: 'L', ...p })
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
    this.arcLengthDivisions = source.arcLengthDivisions
    return this
  }

  clone(): this {
    return new (this.constructor as any)().copy(this)
  }
}
