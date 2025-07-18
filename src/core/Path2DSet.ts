import type { Path2DStyle } from '../types'
import type { FillTriangulatedResult, StrokeTriangulatedResult } from '../utils'
import type { Path2D } from './Path2D'
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

  toTriangulatedSvgString(
    result:
      | FillTriangulatedResult
      | StrokeTriangulatedResult
      | (
        | FillTriangulatedResult
        | StrokeTriangulatedResult
      )[] = this.paths.map(p => p.fillTriangulate()),
    padding = 0,
  ): string {
    let polygonStr = ''
    const min = { x: -padding, y: -padding }
    const max = { x: padding, y: padding }
    const results = Array.isArray(result) ? result : [result]
    results.forEach(({ vertices, indices }) => {
      const getPoint = (indice: number): number[] => {
        const x = vertices[indice * 2]
        const y = vertices[indice * 2 + 1]
        min.x = Math.min(min.x, x + padding)
        max.x = Math.max(max.x, x + padding)
        min.y = Math.min(min.y, y + padding)
        max.y = Math.max(max.y, y + padding)
        return [x, y]
      }
      for (let i = 0, len = indices.length; i < len; i += 3) {
        const p1 = getPoint(indices[i])
        const p2 = getPoint(indices[i + 1])
        const p3 = getPoint(indices[i + 2])
        polygonStr += `<polygon points="${p1.join(',')} ${p2.join(',')} ${p3.join(',')}" fill="black" />`
      }
    })
    const viewBox = [min.x, min.y, max.x - min.x, max.y - min.y]
    return `<svg width="${viewBox[2]}" height="${viewBox[3]}" viewBox="${viewBox.join(' ')}" xmlns="http://www.w3.org/2000/svg">${polygonStr}</svg>`
  }

  toTriangulatedSvg(
    result?:
      | FillTriangulatedResult
      | StrokeTriangulatedResult
      | (
        | FillTriangulatedResult
        | StrokeTriangulatedResult
      )[],
    padding?: number,
  ): SVGElement {
    return new DOMParser()
      .parseFromString(this.toTriangulatedSvgString(result, padding), 'image/svg+xml')
      .documentElement as unknown as SVGElement
  }

  toSvgString(): string {
    const { x, y, width, height } = this.getBoundingBox()!
    const content = this.paths.map(path => path.toSvgPathString()).join('')
    return `<svg viewBox="${x} ${y} ${width} ${height}" width="${width}px" height="${height}px" xmlns="http://www.w3.org/2000/svg">${content}</svg>`
  }

  toSvgUrl(): string {
    return `data:image/svg+xml;base64,${btoa(this.toSvgString())}`
  }

  toSvg(): SVGElement {
    return new DOMParser()
      .parseFromString(this.toSvgString(), 'image/svg+xml')
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
