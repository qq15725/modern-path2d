import type { Curve } from '../curves'
import type { Matrix3 } from '../math'
import type { PathCommand } from '../svg'
import { Point2D } from '../math'
import { addCommandsToPath, dataToCommands } from '../svg'
import { CurvePath } from './CurvePath'

/**
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/Path2D
 */
export class Path2D {
  currentPath = new CurvePath()
  paths: CurvePath[] = [this.currentPath]

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

  addCommands(commands: PathCommand[]): this {
    addCommandsToPath(this, commands)
    return this
  }

  addData(data: string): this {
    this.addCommands(dataToCommands(data))
    return this
  }

  closePath(): this {
    this.currentPath.closePath()
    return this
  }

  moveTo(x: number, y: number): this {
    this.currentPath = new CurvePath()
    this.paths.push(this.currentPath)
    this.currentPath.moveTo(x, y)
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
    this.currentPath.absarc(x, y, radius, startAngle, endAngle, !counterclockwise)
    return this
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this {
    const point = this.currentPath.currentPoint
    const currentX = point.x
    const currentY = point.y
    const dx1 = x1 - currentX
    const dy1 = y1 - currentY
    const dx2 = x2 - x1
    const dy2 = y2 - y1
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
    if (len1 < radius || len2 < radius) {
      this.lineTo(x2, y2)
      return this
    }
    const unitV1 = { x: dx1 / len1, y: dy1 / len1 }
    const unitV2 = { x: dx2 / len2, y: dy2 / len2 }
    const centerX = x1 - unitV1.y * radius
    const centerY = y1 + unitV1.x * radius
    const startAngle = Math.atan2(unitV1.y, unitV1.x)
    const endAngle = Math.atan2(unitV2.y, unitV2.x)
    let angleDiff = endAngle - startAngle
    if (angleDiff > Math.PI) {
      angleDiff -= 2 * Math.PI
    }
    else if (angleDiff < -Math.PI) {
      angleDiff += 2 * Math.PI
    }
    this.arc(centerX, centerY, radius, startAngle, startAngle + angleDiff, false)
    this.lineTo(x2, y2)
    return this
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    this.currentPath.absellipse(x, y, radiusX, radiusY, startAngle, endAngle, !counterclockwise, rotation)
    return this
  }

  rect(x: number, y: number, w: number, h: number): this {
    this.currentPath.rect(x, y, w, h)
    return this
  }

  splineThru(points: Point2D[]): this {
    this.currentPath.splineThru(points)
    return this
  }

  forEachCurve(cb: (curve: Curve) => void): this {
    this.paths.forEach(path => path.curves.forEach(curve => cb(curve)))
    return this
  }

  transform(matrix: Matrix3): this {
    this.forEachCurve(curve => curve.transform(matrix))
    return this
  }

  getMinMax(min = new Point2D(), max = new Point2D()): { min: Point2D, max: Point2D } {
    this.forEachCurve(curve => curve.getMinMax(min, max))
    return { min, max }
  }

  getCommands(): PathCommand[] {
    return this.paths.flatMap(path => path.curves.flatMap(curve => curve.getCommands()))
  }

  getData(): string {
    return this.paths.map(path => path.getData()).join(' ')
  }

  getBoundingBox(): { x: number, y: number, width: number, height: number } {
    const { min, max } = this.getMinMax()
    return {
      x: min.x,
      y: min.y,
      width: max.x - min.x,
      height: max.y - min.y,
    }
  }

  getSvgString(): string {
    const { x, y, width, height } = this.getBoundingBox()
    return `<svg viewBox="${x} ${y} ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="currentColor" d="${this.getData()}"></path></svg>`
  }

  getSvgDataUri(): string {
    return `data:image/svg+xml;base64,${btoa(this.getSvgString())}`
  }

  drawTo(ctx: CanvasRenderingContext2D): void {
    this.forEachCurve((curve) => {
      curve.drawTo(ctx)
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
}
