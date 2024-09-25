import type { Point2D } from './Point2D'
import { CurvePath } from './CurvePath'

export class Path2D {
  currentPath = new CurvePath()
  paths: CurvePath[] = [this.currentPath]

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): this {
    this.currentPath.arc(x, y, radius, startAngle, endAngle, counterclockwise)
    return this
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
    this.currentPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    return this
  }

  lineTo(x: number, y: number): this {
    this.currentPath.lineTo(x, y)
    return this
  }

  moveTo(x: number, y: number): this {
    this.currentPath = new CurvePath()
    this.paths.push(this.currentPath)
    this.currentPath.moveTo(x, y)
    return this
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this {
    this.currentPath.quadraticCurveTo(cpx, cpy, x, y)
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

  draw(ctx: CanvasRenderingContext2D, offset: { x: number, y: number } = { x: 0, y: 0 }): void {
    ctx.beginPath()
    this.paths.forEach((path) => {
      path.curves.forEach((curve) => {
        curve.toPathCommands().forEach((command) => {
          switch (command.type) {
            case 'M':
              ctx.moveTo(command.x + offset.x, command.y + offset.y)
              break
            case 'L':
              ctx.lineTo(command.x + offset.x, command.y + offset.y)
              break
            case 'C':
              ctx.bezierCurveTo(
                command.x1 + offset.x,
                command.y1 + offset.y,
                command.x2 + offset.x,
                command.y2 + offset.y,
                command.x + offset.x,
                command.y + offset.y,
              )
              break
            case 'Q':
              ctx.quadraticCurveTo(
                command.x1 + offset.x,
                command.y1 + offset.y,
                command.x + offset.x,
                command.y + offset.y,
              )
              break
            case 'Z':
              ctx.closePath()
              break
          }
        })
      })
    })
  }
}
