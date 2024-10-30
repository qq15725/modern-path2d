import type { Curve } from '../curves'
import type { Matrix3, VectorLike } from '../math'
import type { PathCommand, PathStyle } from '../types'
import { setCanvasContext } from '../canvas'
import { BoundingBox, Vector2 } from '../math'
import { addPathCommandsToPath2D, pathDataToPathCommands } from '../svg'
import { CurvePath } from './CurvePath'
import { getIntersectionPoint, toKebabCase } from './utils'

/**
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/Path2D
 */
export class Path2D {
  currentPath = new CurvePath()
  paths: CurvePath[] = [this.currentPath]
  style: Partial<PathStyle> = {}

  get startPoint(): Vector2 | undefined {
    return this.currentPath.startPoint
  }

  get currentPoint(): Vector2 | undefined {
    return this.currentPath.currentPoint
  }

  get strokeWidth(): number {
    return this.style.strokeWidth
      ?? (
        (this.style.stroke ?? 'none') === 'none'
          ? 0
          : 1
      )
  }

  constructor(path?: Path2D | PathCommand[] | string) {
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

  addPath(path: Path2D | CurvePath): this {
    if (path instanceof Path2D) {
      this.paths.push(...path.paths.map(v => v.clone()))
    }
    else {
      this.paths.push(path)
    }
    return this
  }

  closePath(): this {
    const startPoint = this.startPoint
    if (startPoint) {
      this.currentPath.closePath()
      if (this.currentPath.curves.length > 0) {
        this.currentPath = new CurvePath().moveTo(startPoint.x, startPoint.y)
        this.paths.push(this.currentPath)
      }
    }
    return this
  }

  moveTo(x: number, y: number): this {
    const { currentPoint, curves } = this.currentPath
    if (!currentPoint.equals({ x, y })) {
      if (curves.length) {
        this.currentPath = new CurvePath().moveTo(x, y)
        this.paths.push(this.currentPath)
      }
      else {
        this.currentPath.moveTo(x, y)
      }
    }
    return this
  }

  lineTo(x: number, y: number): this {
    this.currentPath.lineTo(x, y)
    return this
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
    this.currentPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    return this
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this {
    this.currentPath.quadraticCurveTo(cpx, cpy, x, y)
    return this
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    this.currentPath.arc(x, y, radius, startAngle, endAngle, counterclockwise)
    return this
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this {
    this.currentPath.arcTo(x1, y1, x2, y2, radius)
    return this
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    this.currentPath.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise)
    return this
  }

  rect(x: number, y: number, w: number, h: number): this {
    this.currentPath.rect(x, y, w, h)
    return this
  }

  addCommands(commands: PathCommand[]): this {
    addPathCommandsToPath2D(commands, this)
    return this
  }

  addData(data: string): this {
    this.addCommands(pathDataToPathCommands(data))
    return this
  }

  splineThru(points: Vector2[]): this {
    this.currentPath.splineThru(points)
    return this
  }

  getControlPoints(): Vector2[] {
    return this.paths.flatMap(path => path.getControlPoints())
  }

  getCurves(): Curve[] {
    return this.paths.flatMap(path => path.curves)
  }

  scale(sx: number, sy = sx, target: VectorLike = { x: 0, y: 0 }): this {
    this.getControlPoints().forEach((point) => {
      point.scale(sx, sy, target)
    })
    return this
  }

  skew(ax: number, ay = 0, target: VectorLike = { x: 0, y: 0 }): this {
    this.getControlPoints().forEach((point) => {
      point.skew(ax, ay, target)
    })
    return this
  }

  rotate(a: number, target: VectorLike = { x: 0, y: 0 }): this {
    this.getControlPoints().forEach((point) => {
      point.rotate(a, target)
    })
    return this
  }

  bold(b: number): this {
    if (b === 0) {
      return this
    }
    const curves = this.getCurves()
    const _list: { start: Vector2, end: Vector2, index: number }[] = []
    const _isClockwise: boolean[] = []
    const _points: Vector2[][] = []
    curves.forEach((curve, index) => {
      const points = curve.getControlPoints()
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
        if (indexB !== indexA
          && itemB.start.equals(itemA.end)) {
          list[indexA].push(itemB.index)
        }
      })
    })

    curves.forEach((curve, index) => {
      const isClockwise = _isClockwise[index]
      const points = _points[index]
      points.forEach((point) => {
        const t = curve.getTForPoint(point)
        const dist = curve.getNormal(t).scale(isClockwise ? b : -b)
        point.add(dist)
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
          pointsA[pointsA.length - 1].copy(point)
          pointsB[0].copy(point)
        }
      })
    })
    return this
  }

  matrix(matrix: Matrix3): this {
    this.getCurves().forEach(curve => curve.matrix(matrix))
    return this
  }

  getMinMax(min = Vector2.MAX, max = Vector2.MIN, withStyle = true): { min: Vector2, max: Vector2 } {
    this.getCurves().forEach(curve => curve.getMinMax(min, max))
    if (withStyle) {
      const strokeHalfWidth = this.strokeWidth / 2
      min.x -= strokeHalfWidth
      min.y -= strokeHalfWidth
      max.x += strokeHalfWidth
      max.y += strokeHalfWidth
    }
    return { min, max }
  }

  getBoundingBox(withStyle = true): BoundingBox {
    const { min, max } = this.getMinMax(undefined, undefined, withStyle)
    return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
  }

  drawTo(ctx: CanvasRenderingContext2D, style: Partial<PathStyle> = {}): this {
    style = { ...this.style, ...style }
    const { fill = '#000', stroke = 'none' } = style
    ctx.beginPath()
    ctx.save()
    setCanvasContext(ctx, style)
    this.paths.forEach((path) => {
      path.drawTo(ctx)
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

  drawControlPointsTo(ctx: CanvasRenderingContext2D, style: Partial<PathStyle> = {}): this {
    style = { ...this.style, ...style }
    const { fill = '#000', stroke = 'none' } = style
    ctx.beginPath()
    ctx.save()
    setCanvasContext(ctx, style)
    this.getControlPoints().forEach((point) => {
      ctx.moveTo(point.x, point.y)
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
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

  toCommands(): PathCommand[] {
    return this.paths.flatMap(path => path.toCommands())
  }

  toData(): string {
    return this.paths.map(path => path.toData()).join(' ')
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

  toSvgString(): string {
    const { x, y, width, height } = this.getBoundingBox()
    const path = this.toSvgPathString()
    return `<svg viewBox="${x} ${y} ${width} ${height}" width="${width}px" height="${height}px" xmlns="http://www.w3.org/2000/svg">${path}</svg>`
  }

  toSvgUrl(): string {
    return `data:image/svg+xml;base64,${btoa(this.toSvgString())}`
  }

  toSvg(): SVGElement {
    return new DOMParser()
      .parseFromString(this.toSvgString(), 'image/svg+xml')
      .documentElement as unknown as SVGElement
  }

  toCanvas(options: Partial<PathStyle & { pixelRatio: number }> = {}): HTMLCanvasElement {
    const { pixelRatio = 2, ...style } = options
    const { left, top, width, height } = this.getBoundingBox()
    const canvas = document.createElement('canvas')
    canvas.width = width * pixelRatio
    canvas.height = height * pixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(pixelRatio, pixelRatio)
      ctx.translate(-left, -top)
      this.drawTo(ctx, style)
    }
    return canvas
  }

  copy(source: Path2D): this {
    this.currentPath = source.currentPath.clone()
    this.paths = source.paths.map(path => path.clone())
    this.style = { ...source.style }
    return this
  }

  clone(): this {
    return new (this.constructor as any)().copy(this)
  }
}
