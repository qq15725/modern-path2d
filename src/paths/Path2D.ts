import type { Curve } from '../curves'
import type { Matrix3 } from '../math'
import type { PathCommand, PathStyle } from '../types'
import { setCanvasContext } from '../canvas'
import { BoundingBox, Vector2 } from '../math'
import { addPathCommandsToPath2D, pathDataToPathCommands } from '../svg'
import { CurvePath } from './CurvePath'
import { toKebabCase } from './utils'

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

  forEachCurve(cb: (curve: Curve) => void): this {
    this.paths.forEach(path => path.curves.forEach(curve => cb(curve)))
    return this
  }

  transformPoint(cb: (point: Vector2) => void): this {
    this.forEachCurve(curve => curve.transformPoint(cb))
    return this
  }

  transform(matrix: Matrix3): this {
    this.forEachCurve(curve => curve.transform(matrix))
    return this
  }

  getMinMax(min = Vector2.MAX, max = Vector2.MIN): { min: Vector2, max: Vector2 } {
    this.forEachCurve(curve => curve.getMinMax(min, max))
    return { min, max }
  }

  getBoundingBox(withStrokeWidth = true): BoundingBox {
    const { min, max } = this.getMinMax()
    const bbox = new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
    if (withStrokeWidth) {
      const strokeWidth = this.strokeWidth
      bbox.left -= strokeWidth / 2
      bbox.top -= strokeWidth / 2
      bbox.width += strokeWidth
      bbox.height += strokeWidth
    }
    return bbox
  }

  getCommands(): PathCommand[] {
    return this.paths.flatMap(path => path.getCommands())
  }

  getData(): string {
    return this.paths.map(path => path.getData()).join(' ')
  }

  getSvgPathXml(): string {
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
    return `<path d="${this.getData()}" style="${cssText}"></path>`
  }

  getSvgXml(): string {
    const { x, y, width, height } = this.getBoundingBox()
    const path = this.getSvgPathXml()
    return `<svg viewBox="${x} ${y} ${width} ${height}" width="${width}px" height="${height}px" xmlns="http://www.w3.org/2000/svg">${path}</svg>`
  }

  getSvgDataUri(): string {
    return `data:image/svg+xml;base64,${btoa(this.getSvgXml())}`
  }

  drawTo(ctx: CanvasRenderingContext2D, withStyle = true): void {
    const { fill = '#000', stroke = 'none' } = this.style
    if (withStyle) {
      setCanvasContext(ctx, this.style)
    }
    this.paths.forEach((path) => {
      path.drawTo(ctx)
    })
    if (fill !== 'none') {
      ctx.fill()
    }
    if (stroke !== 'none') {
      ctx.stroke()
    }
  }

  copy(source: Path2D): this {
    this.currentPath = source.currentPath.clone()
    this.paths = source.paths.map(path => path.clone())
    this.style = { ...source.style }
    return this
  }

  toSvg(): SVGElement {
    return new DOMParser()
      .parseFromString(this.getSvgXml(), 'image/svg+xml')
      .documentElement as unknown as SVGElement
  }

  toCanvas(pixelRatio = 2): HTMLCanvasElement {
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
      this.drawTo(ctx)
    }
    return canvas
  }

  clone(): this {
    return new (this.constructor as any)().copy(this)
  }
}
