import type { Curve } from '../curves'
import type { Matrix3 } from '../math'
import type { PathCommand } from '../svg'
import { BoundingBox, Vector2 } from '../math'
import { addPathCommandsToPath2D, pathDataToPathCommands } from '../svg'
import { CurvePath } from './CurvePath'

/**
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/Path2D
 */
export class Path2D<T = any> {
  currentPath = new CurvePath()
  paths: CurvePath[] = [this.currentPath]
  userData?: T

  get startPoint(): Vector2 | undefined {
    return this.currentPath.startPoint
  }

  get currentPoint(): Vector2 | undefined {
    return this.currentPath.currentPoint
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

  getBoundingBox(): BoundingBox {
    const { min, max } = this.getMinMax()
    return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
  }

  getCommands(): PathCommand[] {
    return this.paths.flatMap(path => path.getCommands())
  }

  getData(): string {
    return this.paths.map(path => path.getData()).join(' ')
  }

  getSvgString(): string {
    const { x, y, width, height } = this.getBoundingBox()
    const strokeWidth = 1
    return `<svg viewBox="${x - strokeWidth} ${y - strokeWidth} ${width + strokeWidth * 2} ${height + strokeWidth * 2}" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="currentColor" d="${this.getData()}"></path></svg>`
  }

  getSvgDataUri(): string {
    return `data:image/svg+xml;base64,${btoa(this.getSvgString())}`
  }

  drawTo(ctx: CanvasRenderingContext2D): void {
    this.paths.forEach((path) => {
      path.drawTo(ctx)
    })
  }

  strokeTo(ctx: CanvasRenderingContext2D): void {
    this.drawTo(ctx)
    ctx.stroke()
  }

  fillTo(ctx: CanvasRenderingContext2D): void {
    this.drawTo(ctx)
    ctx.fill()
  }

  copy(source: Path2D): this {
    this.currentPath = source.currentPath.clone()
    this.paths = source.paths.map(path => path.clone())
    this.userData = source.userData
    return this
  }

  toCanvas(fill = true): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const { left, top, width, height } = this.getBoundingBox()
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.translate(-left, -top)
      if (fill) {
        this.fillTo(ctx)
      }
      else {
        this.strokeTo(ctx)
      }
    }
    return canvas
  }

  clone(): this {
    return new (this.constructor as any)().copy(this)
  }
}
