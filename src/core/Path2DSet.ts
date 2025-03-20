import type { Path2D } from './Path2D'
import type { Path2DStyle } from './Path2DStyle'
import { BoundingBox, Vector2 } from '../math'

export class Path2DSet {
  constructor(
    public paths: Path2D[] = [],
    public viewBox?: number[],
  ) {
    //
  }

  getBoundingBox(withStyle = true): BoundingBox | undefined {
    if (!this.paths.length) {
      return undefined
    }
    const min = Vector2.MAX
    const max = Vector2.MIN
    this.paths.forEach(path => path.getMinMax(min, max, withStyle))
    return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
  }

  toSVGString(): string {
    const { x, y, width, height } = this.getBoundingBox()!
    const content = this.paths.map(path => path.toSVGPathString()).join('')
    return `<svg viewBox="${x} ${y} ${width} ${height}" width="${width}px" height="${height}px" xmlns="http://www.w3.org/2000/svg">${content}</svg>`
  }

  toSVGUrl(): string {
    return `data:image/svg+xml;base64,${btoa(this.toSVGString())}`
  }

  toSVG(): SVGElement {
    return new DOMParser()
      .parseFromString(this.toSVGString(), 'image/svg+xml')
      .documentElement as unknown as SVGElement
  }

  toCanvas(options: Partial<Path2DStyle & { pixelRatio: number }> = {}): HTMLCanvasElement {
    const { pixelRatio = 2, ...style } = options
    const { left, top, width, height } = this.getBoundingBox()!
    const canvas = document.createElement('canvas')
    canvas.width = width * pixelRatio
    canvas.height = height * pixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(pixelRatio, pixelRatio)
      ctx.translate(-left, -top)
      this.paths.forEach((path) => {
        path.drawTo(ctx, style)
      })
    }
    return canvas
  }
}
