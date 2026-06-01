import type { Transform2D, Vector2Like } from '../math'
import type { FillRule, Path2DCommand, Path2DData } from '../types'
import type {
  FillTriangulatedResult,
  FillTriangulateOptions,
  StrokeTriangulatedResult,
  StrokeTriangulateOptions,
} from '../utils'
import { BoundingBox, Vector2 } from '../math'
import { svgPathCommandsToData } from '../methods'
import { fillTriangulate, pointInPolygon, pointToPolylineDistance, strokeTriangulate } from '../utils'

export interface IsPointInFillOptions {
  fillRule?: FillRule
}

export interface IsPointInStrokeOptions {
  strokeWidth?: number
  tolerance?: number
  closed?: boolean
}

export abstract class Curve {
  arcLengthDivision = 200
  protected _lengths: number[] = []
  protected _adaptiveCache?: number[]
  /**
   * Parent composite, set lazily when a composite caches its children. Lets
   * {@link invalidate} propagate up so an ancestor's caches refresh too.
   */
  _owner?: Curve
  protected _invalidating = false

  abstract getPoint(t: number, output?: Vector2): Vector2

  /**
   * Drop cached arc lengths and the cached sampled outline used by hit testing, then
   * bubble up to {@link _owner}. Called automatically by {@link applyTransform} and the
   * `Path2D` mutators; call it manually after mutating control-point coordinates in place —
   * the caches cannot observe such mutations.
   */
  invalidate(): this {
    if (this._invalidating) {
      return this // re-entrancy guard: blocks the upward bubble re-triggering a downward sweep
    }
    this._invalidating = true
    this._invalidateSelf()
    this._owner?.invalidate()
    this._invalidating = false
    return this
  }

  /** Clears this curve's own caches. Composites also clear their children (see override). */
  protected _invalidateSelf(): void {
    this._lengths.length = 0
    this._adaptiveCache = undefined
  }

  /**
   * Sampled outline cached for repeated hit tests (read-only — do not mutate the result).
   * Invalidated by {@link invalidate}.
   */
  protected _getCachedAdaptiveVertices(): number[] {
    return this._adaptiveCache ??= this.getAdaptiveVertices()
  }

  getPointAt(u: number, output = new Vector2()): Vector2 {
    return this.getPoint(this.getUToTMapping(u), output)
  }

  isClockwise(): boolean {
    return false
  }

  getControlPointRefs(): Vector2[] {
    return []
  }

  /**
   * Reverse the traversal direction in place (start ↔ end, same geometry). The base
   * implementation reverses the order of the control-point *values*, which is correct for
   * line / Bézier / spline primitives whose {@link getControlPointRefs} order matches their
   * parametric order. {@link RoundCurve} (angle-based) and composites (child order) override it.
   */
  reverse(): this {
    const refs = this.getControlPointRefs()
    const n = refs.length
    const snapshot = refs.map(p => p.clone())
    for (let i = 0; i < n; i++) {
      refs[i].copyFrom(snapshot[n - 1 - i])
    }
    this.invalidate()
    return this
  }

  applyTransform(transform: Transform2D | ((point: Vector2) => void)): this {
    const isFunction = typeof transform === 'function'
    this.getControlPointRefs().forEach((p) => {
      if (isFunction) {
        transform(p)
      }
      else {
        transform.apply(p, p)
      }
    })
    this.invalidate()
    return this
  }

  getUnevenVertices(count = 5, output: number[] = []): number[] {
    const p = new Vector2()
    for (let i = 0, len = Math.max(1, count) - 1; i <= len; i++) {
      this.getPoint(i / len, p)
      output.push(p.x, p.y)
    }
    return output
  }

  getSpacedVertices(count = 5, output: number[] = []): number[] {
    const p = new Vector2()
    for (let i = 0, len = Math.max(1, count) - 1; i <= len; i++) {
      this.getPointAt(i / len, p)
      output.push(p.x, p.y)
    }
    return output
  }

  getAdaptiveVertices(output: number[] = []): number[] {
    return this.getUnevenVertices(5, output)
  }

  protected _verticesToPoints(vertices: number[], output: Vector2[] = []): Vector2[] {
    for (let i = 0, len = vertices.length; i < len; i += 2) {
      const x = vertices[i]
      const y = vertices[i + 1]
      output.push(new Vector2(x, y))
    }
    return output
  }

  getSpacedPoints(count?: number, output: Vector2[] = []): Vector2[] {
    const array = this.getSpacedVertices(count)
    this._verticesToPoints(array, output)
    return output
  }

  getUnevenPoints(count?: number, output: Vector2[] = []): Vector2[] {
    const array = this.getUnevenVertices(count)
    this._verticesToPoints(array, output)
    return output
  }

  getAdaptivePoints(output: Vector2[] = []): Vector2[] {
    const array = this.getAdaptiveVertices()
    this._verticesToPoints(array, output)
    return output
  }

  getPoints(count?: number, output: Vector2[] = []): Vector2[] {
    let array
    if (count) {
      array = this.getUnevenVertices(count)
    }
    else {
      array = this.getAdaptiveVertices()
    }
    this._verticesToPoints(array, output)
    return output
  }

  getLength(): number {
    const lengths = this.getLengths()
    return lengths[lengths.length - 1] ?? 0
  }

  getLengths(): number[] {
    if (this._lengths.length !== this.arcLengthDivision + 1) {
      this.updateLengths()
    }
    return this._lengths
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
    this._lengths = arcLengths
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
    i = Math.max(0, high)
    if (lengths[i] === targetLen) {
      return i / (lengthsLen - 1)
    }
    const before = lengths[i]
    const after = lengths[i + 1]
    const segmentLength = after - before
    const segmentFraction = Math.max(0, (targetLen - before) / segmentLength)
    return (i + segmentFraction) / (lengthsLen - 1)
  }

  getTangent(t: number, output = new Vector2()): Vector2 {
    const delta = 0.0001
    const t1 = Math.max(0, t - delta)
    const t2 = Math.min(1, t + delta)
    return output.copyFrom(this.getPoint(t2).sub(this.getPoint(t1)).normalize())
  }

  getTangentAt(u: number, output?: Vector2): Vector2 {
    return this.getTangent(this.getUToTMapping(u), output)
  }

  /**
   * PathKit-style sample at an absolute arc-length `distance` along the curve: the point, the unit
   * tangent, and the tangent `angle` in radians. `distance` is clamped to `[0, getLength()]`, so
   * passing `0`/`getLength()` always yields the endpoints. See {@link PathMeasure} for a wrapper.
   */
  getPosTan(distance: number): { position: Vector2, tangent: Vector2, angle: number } {
    const length = this.getLength()
    const u = length > 0 ? Math.min(Math.max(distance / length, 0), 1) : 0
    const t = this.getUToTMapping(u)
    const tangent = this.getTangent(t)
    return {
      position: this.getPoint(t),
      tangent,
      angle: Math.atan2(tangent.y, tangent.x),
    }
  }

  getNormal(t: number, output = new Vector2()): Vector2 {
    this.getTangent(t, output)
    return output.set(-output.y, output.x).normalize()
  }

  getNormalAt(u: number, output?: Vector2): Vector2 {
    return this.getNormal(this.getUToTMapping(u), output)
  }

  getTForPoint(target: Vector2Like, epsilon = 0.001): number {
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
    // Iterate the flat vertex array directly: avoids the per-point Vector2
    // allocation of getPoints() and the per-call array allocation inside
    // clampMin/clampMax.
    const vertices = this.getAdaptiveVertices()
    let minX = min.x
    let minY = min.y
    let maxX = max.x
    let maxY = max.y
    for (let i = 0, len = vertices.length; i < len; i += 2) {
      const x = vertices[i]
      const y = vertices[i + 1]
      if (x < minX)
        minX = x
      if (y < minY)
        minY = y
      if (x > maxX)
        maxX = x
      if (y > maxY)
        maxY = y
    }
    min.set(minX, minY)
    max.set(maxX, maxY)
    return { min: min.finite(), max: max.finite() }
  }

  getBoundingBox(): BoundingBox {
    const { min, max } = this.getMinMax()
    return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
  }

  /**
   * Test whether a point lies inside the area enclosed by this curve.
   *
   * The curve is sampled via {@link getAdaptiveVertices} into a single implicitly closed
   * ring. This is purely geometric (it ignores any `fill`/`stroke` style), mirroring
   * `CanvasRenderingContext2D.isPointInPath`.
   *
   * Composites that hold multiple sub-paths (e.g. {@link Path2D}) override this so holes
   * are honored — a single `Curve` is always one ring.
   */
  isPointInFill(point: Vector2Like, options: IsPointInFillOptions = {}): boolean {
    return pointInPolygon(point, this._getCachedAdaptiveVertices(), options.fillRule)
  }

  /**
   * Test whether a point lies on this curve's stroke, i.e. within `strokeWidth / 2 + tolerance`
   * of the sampled outline. The point must be in the same coordinate space as the curve.
   *
   * Options: `strokeWidth` (path units, default `1`), `tolerance` (extra hit slack in path
   * units, default `0` — useful for thin strokes; no coordinate scaling is assumed, so convert
   * pixel tolerance to path units upstream if your path is normalized), and `closed` (whether
   * to include the closing edge from the last vertex back to the first).
   */
  isPointInStroke(point: Vector2Like, options: IsPointInStrokeOptions = {}): boolean {
    const { strokeWidth = 1, tolerance = 0, closed = false } = options
    const distance = pointToPolylineDistance(point, this._getCachedAdaptiveVertices(), closed)
    return distance <= strokeWidth / 2 + tolerance
  }

  /**
   * Concise PathKit-style fill containment test: `contains(x, y)` is shorthand for
   * {@link isPointInFill} with a `{ x, y }` point.
   */
  contains(x: number, y: number, options: IsPointInFillOptions = {}): boolean {
    return this.isPointInFill({ x, y }, options)
  }

  getFillVertices(_options?: FillTriangulateOptions): number[] {
    return this.getAdaptiveVertices()
  }

  fillTriangulate(options?: FillTriangulateOptions): FillTriangulatedResult {
    return fillTriangulate(
      this.getFillVertices(options),
      options,
    )
  }

  /**
   * Whether this curve forms a closed loop (its outline should be stroked without end caps,
   * stitching the last vertex back to the first). The base test is purely geometric — the first
   * sampled vertex coincides with the last. Curves that close without a duplicated endpoint
   * (a full-revolution {@link RoundCurve}, rectangles, polygons) override this.
   */
  isClosed(): boolean {
    const v = this._getCachedAdaptiveVertices()
    const len = v.length
    if (len < 6) {
      return false
    }
    const eps = 1e-4
    return Math.abs(v[0] - v[len - 2]) < eps && Math.abs(v[1] - v[len - 1]) < eps
  }

  strokeTriangulate(options?: StrokeTriangulateOptions): StrokeTriangulatedResult {
    return strokeTriangulate(
      this.getAdaptiveVertices(),
      {
        ...options,
        closed: options?.closed ?? this.isClosed(),
      },
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

  copyFrom(source: Curve): this {
    this.arcLengthDivision = source.arcLengthDivision
    return this
  }

  clone(): this {
    return new (this.constructor as any)().copyFrom(this)
  }
}
