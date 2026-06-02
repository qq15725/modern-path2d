import type { Vector2Like } from '../math'
import type { FillRule, Path2DCommand, Path2DData, Path2DStyle } from '../types'
import type {
  BooleanOp,
  FillTriangulatedResult,
  FillTriangulateOptions,
  StrokeTriangulatedResult,
  StrokeTriangulateOptions,
} from '../utils'
import type { IsPointInFillOptions, IsPointInStrokeOptions } from './Curve'
import { drawPoint, setCanvasContext } from '../canvas'
import { CompositeCurve } from '../curves'
import { BoundingBox, Vector2 } from '../math'
import { svgPathCommandsAddToPath2D, svgPathDataToCommands } from '../methods'
import { evenoddFillRule, fillTriangulate, getIntersectionPoint, nonzeroFillRule, pointInPolygons, polygonBoolean, toKebabCase } from '../utils'
import { CurvePath } from './CurvePath'

/**
 * @link https://developer.mozilla.org/zh-CN/docs/Web/API/Path2D
 *
 * Path2D
 * --CurvePath
 * ----LineCurve
 * ----EllipseCurve
 * ----CubicBezierCurve
 * ----...
 */
export class Path2D<T = any> extends CompositeCurve<CurvePath> {
  protected _meta?: T
  protected _ringsCache?: number[][]
  protected _ringsCacheLen = -1
  currentCurve = new CurvePath()
  style: Partial<Path2DStyle>

  get startPoint(): Vector2 | undefined {
    return this.currentCurve.startPoint
  }

  get currentPoint(): Vector2 | undefined {
    return this.currentCurve.currentPoint
  }

  get strokeWidth(): number {
    return this.style.strokeWidth
      ?? (
        (this.style.stroke ?? 'none') === 'none'
          ? 0
          : 1
      )
  }

  constructor(path?: Path2D | Path2DCommand[] | Path2DData, style: Partial<Path2DStyle> = {}) {
    super()
    this.curves.push(this.currentCurve)
    this.style = style
    if (path) {
      if (path instanceof Path2D) {
        this.addPath(path)
      }
      else if (Array.isArray(path)) {
        this.addCommands(path)
      }
      else {
        this.addData(path)
      }
    }
  }

  getMeta(): T | undefined {
    return this._meta
  }

  setMeta(meta: T | undefined): this {
    this._meta = meta
    return this
  }

  addPath(path: Path2D | CurvePath): this {
    const curvePaths = path instanceof Path2D ? path.curves : [path]
    if (curvePaths.filter(curvePath => curvePath.curves.length).length === 0) {
      return this
    }
    if (!this.currentCurve.curves.length) {
      const index = this.curves.findIndex(v => v === this.currentCurve)
      if (index > -1) {
        this.curves.splice(index, 1)
      }
    }
    this.curves.push(...curvePaths.map(v => v.clone()))
    this.currentCurve = this.curves[this.curves.length - 1]
    return this
  }

  closePath(): this {
    const startPoint = this.startPoint
    if (startPoint && this.currentCurve.curves.length) {
      this.currentCurve.closePath()
      this.currentCurve = new CurvePath().moveTo(startPoint.x, startPoint.y)
      this.curves.push(this.currentCurve)
    }
    return this
  }

  moveTo(x: number, y: number): this {
    // Web Path2D spec: moveTo always starts a new subpath.
    if (this.currentCurve.curves.length) {
      this.currentCurve = new CurvePath()
      this.curves.push(this.currentCurve)
    }
    this.currentCurve.moveTo(x, y)
    return this
  }

  lineTo(x: number, y: number): this {
    this.currentCurve.lineTo(x, y)
    return this
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
    this.currentCurve.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    return this
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this {
    this.currentCurve.quadraticCurveTo(cpx, cpy, x, y)
    return this
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    this.currentCurve.arc(x, y, radius, startAngle, endAngle, counterclockwise)
    return this
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this {
    this.currentCurve.arcTo(x1, y1, x2, y2, radius)
    return this
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    this.currentCurve.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise)
    return this
  }

  rect(x: number, y: number, width: number, height: number): this {
    this.currentCurve.rect(x, y, width, height)
    return this
  }

  roundRect(x: number, y: number, width: number, height: number, radii: number): this {
    this.currentCurve.roundRect(x, y, width, height, radii)
    return this
  }

  reset(): this {
    this.currentCurve = new CurvePath()
    this.curves = [this.currentCurve]
    this.style = {}
    return this
  }

  addCommands(commands: Path2DCommand[]): this {
    svgPathCommandsAddToPath2D(commands, this)
    return this
  }

  addData(data: Path2DData): this {
    this.addCommands(svgPathDataToCommands(data))
    return this
  }

  splineThru(points: Vector2[]): this {
    this.currentCurve.splineThru(points)
    return this
  }

  scale(sx: number, sy = sx, target: Vector2Like = { x: 0, y: 0 }): this {
    this.getControlPointRefs().forEach((point) => {
      point.scale(sx, sy, target)
    })
    this.invalidate()
    return this
  }

  skew(ax: number, ay = 0, target: Vector2Like = { x: 0, y: 0 }): this {
    this.getControlPointRefs().forEach((point) => {
      point.skew(ax, ay, target)
    })
    this.invalidate()
    return this
  }

  rotate(rad: number, target: Vector2Like = { x: 0, y: 0 }): this {
    this.getControlPointRefs().forEach((point) => {
      point.rotate(rad, target)
    })
    this.invalidate()
    return this
  }

  bold(b: number): this {
    if (b === 0) {
      return this
    }

    const curves = this.getFlatCurves()
    const _list: { start: Vector2, end: Vector2, index: number }[] = []
    const _isClockwise: boolean[] = []
    const _points: Vector2[][] = []
    curves.forEach((curve, index) => {
      const points = curve.getControlPointRefs()
      const isClockwise = curve.isClockwise()
      _points[index] = points
      _isClockwise[index] = isClockwise
      const start = points[0]
      const end = points[points.length - 1] ?? start
      _list.push({
        start: isClockwise ? end : start,
        end: isClockwise ? start : end,
        index,
      })
    })
    const list: number[][] = []
    _list.forEach((itemA, indexA) => {
      list[indexA] = []
      _list.forEach((itemB, indexB) => {
        if (
          itemB.start
          && itemA.end
          && indexB !== indexA
          && itemB.start?.equals(itemA.end)) {
          list[indexA].push(itemB.index)
        }
      })
    })

    curves.forEach((curve, index) => {
      const isClockwise = _isClockwise[index]
      _points[index].forEach((point) => {
        point.add(
          curve.getNormal(
            curve.getTForPoint(point),
          ).scale(isClockwise ? b : -b),
        )
      })
    })

    list.forEach((indexes, indexA) => {
      const pointsA = _points[indexA]
      indexes.forEach((indexB) => {
        const pointsB = _points[indexB]
        const point = getIntersectionPoint(
          pointsA[pointsA.length - 1],
          pointsA[pointsA.length - 2] ?? pointsA[pointsA.length - 1],
          pointsB[0],
          pointsB[1] ?? pointsB[0],
        )
        if (point) {
          pointsA[pointsA.length - 1].copyFrom(point)
          pointsB[0].copyFrom(point)
        }
      })
    })
    this.invalidate()
    return this
  }

  /**
   * Test whether a point lies inside the filled area of this path.
   *
   * Each sub-path ({@link CurvePath}) is sampled into its own ring and all rings are
   * evaluated together via {@link pointInPolygons}, so holes (donut / hollow shapes) are
   * honored. This is purely geometric and ignores `style.fill` — for the `fill: 'none'`
   * fallback, gate the call upstream (see {@link Path2DSet.hitTest}).
   *
   * Defaults `fillRule` to `style.fillRule`, then `'nonzero'` (matching SVG/Canvas).
   */
  protected override _invalidateSelf(): void {
    super._invalidateSelf()
    this._ringsCache = undefined
    this._ringsCacheLen = -1
  }

  /** Per-sub-path sampled rings, cached for repeated hit tests. */
  protected _getRings(): number[][] {
    if (!this._ringsCache || this._ringsCacheLen !== this.curves.length) {
      this._ringsCache = this.curves.map((curve) => {
        curve._owner = this
        return curve.getAdaptiveVertices()
      })
      this._ringsCacheLen = this.curves.length
    }
    return this._ringsCache
  }

  override isPointInFill(point: Vector2Like, options: IsPointInFillOptions = {}): boolean {
    const fillRule: FillRule = options.fillRule ?? this.style.fillRule ?? 'nonzero'
    return pointInPolygons(point, this._getRings(), fillRule)
  }

  /** Build a `Path2D` from flat rings (`[x0,y0,…]` per sub-path); closed-and-filled as sub-paths. */
  static fromRings(rings: number[][], style: Partial<Path2DStyle> = {}): Path2D {
    const path = new Path2D(undefined, style)
    for (const ring of rings) {
      if (ring.length < 6) {
        continue
      }
      // Drop a trailing duplicate of the start point — closePath() re-adds the closing edge.
      let end = ring.length
      if (
        ring[0] === ring[end - 2]
        && ring[1] === ring[end - 1]
      ) {
        end -= 2
      }
      path.moveTo(ring[0], ring[1])
      for (let i = 2; i < end; i += 2) {
        path.lineTo(ring[i], ring[i + 1])
      }
      path.closePath()
    }
    return path
  }

  /**
   * Boolean (path) operation against another path, returning a NEW `Path2D` whose outline is the
   * polygonal result. Curves are sampled before clipping, so the result is a polygonal
   * approximation (see {@link polygonBoolean}). The result inherits this path's `style` unless
   * overridden via `style`. Holes are emitted as oppositely-wound sub-paths (nonzero fill).
   */
  booleanOp(op: BooleanOp, other: Path2D, style?: Partial<Path2DStyle>): Path2D {
    const rings = polygonBoolean(op, this._getRings(), other._getRings())
    return Path2D.fromRings(rings, { ...this.style, ...style })
  }

  /** `this ∪ other` — the combined filled area. */
  union(other: Path2D, style?: Partial<Path2DStyle>): Path2D {
    return this.booleanOp('union', other, style)
  }

  /** `this ∩ other` — only the overlapping area. */
  intersection(other: Path2D, style?: Partial<Path2DStyle>): Path2D {
    return this.booleanOp('intersection', other, style)
  }

  /** `this − other` — this path with `other` cut away. */
  difference(other: Path2D, style?: Partial<Path2DStyle>): Path2D {
    return this.booleanOp('difference', other, style)
  }

  /** `this ⊕ other` — areas covered by exactly one of the two paths. */
  xor(other: Path2D, style?: Partial<Path2DStyle>): Path2D {
    return this.booleanOp('xor', other, style)
  }

  /**
   * Test whether a point lies on this path's stroke. A hit on any sub-path counts.
   *
   * Defaults `strokeWidth` to this path's own {@link strokeWidth} (which is `0` when
   * `style.stroke` is `'none'`). Each sub-path infers its own closed-ness unless `closed`
   * is given explicitly.
   */
  override isPointInStroke(point: Vector2Like, options: IsPointInStrokeOptions = {}): boolean {
    const strokeWidth = options.strokeWidth ?? this.strokeWidth
    const { tolerance = 0, closed } = options
    return this.curves.some(curve => curve.isPointInStroke(point, {
      strokeWidth,
      tolerance,
      closed,
    }))
  }

  override getMinMax(min = Vector2.MAX, max = Vector2.MIN, withStyle = true): { min: Vector2, max: Vector2 } {
    this.curves.forEach((curve) => {
      curve.getMinMax(min, max)
    })
    if (withStyle) {
      const strokeWidth = this.strokeWidth
      // Inflate the (analytical) geometric bounds by half the stroke width instead of
      // sampling the offset outline. Equivalent to the union of per-curve offsets, and
      // conservative for round/bevel joins. Sharp miter spikes are not accounted for —
      // neither was the prior sampled approximation.
      if (strokeWidth > 1 && Number.isFinite(min.x)) {
        const half = strokeWidth / 2
        min.set(min.x - half, min.y - half)
        max.set(max.x + half, max.y + half)
      }
    }
    return { min: min.finite(), max: max.finite() }
  }

  override strokeTriangulate(options?: StrokeTriangulateOptions): StrokeTriangulatedResult {
    const indices = options?.indices ?? []
    const vertices = options?.vertices ?? []
    this.curves.forEach((curve) => {
      curve.strokeTriangulate({
        ...options,
        indices,
        vertices,
        style: { ...this.style },
      })
    })
    return { indices, vertices }
  }

  override fillTriangulate(options?: FillTriangulateOptions): FillTriangulatedResult {
    const _options: FillTriangulateOptions = {
      ...options,
      style: {
        ...this.style,
        ...options?.style,
      },
    }

    const indices = _options.indices ?? []
    const vertices = _options.vertices ?? []
    // Explicit `options.fillRule` wins, then `style.fillRule`, then nonzero (SVG/Canvas default).
    const fillRule: FillRule = options?.fillRule ?? _options.style!.fillRule ?? 'nonzero'
    if (fillRule === 'nonzero') {
      const paths = this.curves
        .map(curve => curve.getFillVertices(_options))
      const groups = nonzeroFillRule(paths)
      const groupsLen = groups.length
      for (let i = 0; i < groupsLen; i++) {
        const groupA = groups[i]
        const pointArray = paths[i]
        if (groupA.winding || !pointArray.length) {
          continue
        }
        const _pointArray = pointArray.slice()
        const holes: number[] = []
        for (let j = 0; j < groupsLen; j++) {
          const groupB = groups[j]
          if (groupB.parentIndex === i) {
            holes.push(_pointArray.length / 2)
            _pointArray.push(...paths[groupB.index])
          }
        }
        fillTriangulate(_pointArray, {
          ...options,
          indices,
          vertices,
          holes,
          style: { ...this.style },
        })
      }
    }
    else {
      // even-odd: nest rings by containment parity so holes are real holes, not solid overlaps.
      const paths = this.curves
        .map(curve => curve.getFillVertices(_options))
      const groups = evenoddFillRule(paths)
      const groupsLen = groups.length
      for (let i = 0; i < groupsLen; i++) {
        const pointArray = paths[i]
        // odd depth = hole (emitted as a hole of its shell below); skip as a standalone shell.
        if ((groups[i].depth & 1) === 1 || !pointArray.length) {
          continue
        }
        const _pointArray = pointArray.slice()
        const holes: number[] = []
        for (let j = 0; j < groupsLen; j++) {
          if (groups[j].parentIndex === i && (groups[j].depth & 1) === 1) {
            holes.push(_pointArray.length / 2)
            _pointArray.push(...paths[j])
          }
        }
        fillTriangulate(_pointArray, {
          ...options,
          indices,
          vertices,
          holes,
          style: { ...this.style },
        })
      }
    }
    return { indices, vertices }
  }

  getBoundingBox(withStyle = true): BoundingBox {
    const { min, max } = this.getMinMax(undefined, undefined, withStyle)
    return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
  }

  drawTo(ctx: CanvasRenderingContext2D, style: Partial<Path2DStyle> = {}): this {
    style = { ...this.style, ...style }
    const { fill = '#000', stroke = 'none', fillRule = 'nonzero' } = style
    ctx.beginPath()
    ctx.save()
    setCanvasContext(ctx, style)
    this.curves.forEach((path) => {
      path.drawTo(ctx)
    })
    if (fill !== 'none') {
      // Pass the fill rule through — otherwise `evenodd` paths (holes, self-overlap) fill solid.
      ctx.fill(fillRule)
    }
    if (stroke !== 'none') {
      ctx.stroke()
    }
    ctx.restore()
    return this
  }

  drawControlPointsTo(ctx: CanvasRenderingContext2D, style: Partial<Path2DStyle> = {}): this {
    style = { ...this.style, ...style }
    const { fill = '#000', stroke = 'none' } = style
    ctx.beginPath()
    ctx.save()
    setCanvasContext(ctx, style)
    this.getControlPointRefs().forEach((point) => {
      drawPoint(ctx, point.x, point.y, { radius: 4 })
    })
    if (fill !== 'none') {
      ctx.fill()
    }
    if (stroke !== 'none') {
      ctx.stroke()
    }
    ctx.restore()
    return this
  }

  toCommands(): Path2DCommand[] {
    return this.curves.flatMap(v => v.toCommands())
  }

  toData(): Path2DData {
    return this.curves.filter(v => v.curves.length).map(v => v.toData()).join(' ')
  }

  toSvgPathString(): string {
    const style: Record<string, any> = {
      ...this.style,
      fill: this.style.fill ?? '#000',
      stroke: this.style.stroke ?? 'none',
    }
    const cssStyle: Record<string, any> = {}
    for (const key in style) {
      if (style[key] !== undefined) {
        cssStyle[toKebabCase(key)] = style[key]
      }
    }
    Object.assign(cssStyle, {
      'stroke-width': `${this.strokeWidth}px`,
    })
    let cssText = ''
    for (const key in cssStyle) {
      if (cssStyle[key] !== undefined) {
        cssText += `${key}:${cssStyle[key]};`
      }
    }
    return `<path d="${this.toData()}" style="${cssText}"></path>`
  }

  override copyFrom(source: Path2D): this {
    super.copyFrom(source)
    this.currentCurve = source.currentCurve.clone()
    this.style = { ...source.style }
    return this
  }
}
