import type { Path2D } from './paths'
import type { PathStyle } from './types'
import { BoundingBox, Vector2 } from './math'

export function getPathsBoundingBox(paths: Path2D[], withStyle = true): BoundingBox | undefined {
  if (!paths.length) {
    return undefined
  }
  const min = Vector2.MAX
  const max = Vector2.MIN
  paths.forEach(path => path.getMinMax(min, max, withStyle))
  return new BoundingBox(min.x, min.y, max.x - min.x, max.y - min.y)
}

export function pathsToSVGString(paths: Path2D[]): string {
  const { x, y, width, height } = getPathsBoundingBox(paths)!
  const content = paths.map(path => path.toSVGPathString()).join('')
  return `<svg viewBox="${x} ${y} ${width} ${height}" width="${width}px" height="${height}px" xmlns="http://www.w3.org/2000/svg">${content}</svg>`
}

export function pathsToSVGUrl(paths: Path2D[]): string {
  return `data:image/svg+xml;base64,${btoa(pathsToSVGString(paths))}`
}

export function pathsToSVG(paths: Path2D[]): SVGElement {
  return new DOMParser()
    .parseFromString(pathsToSVGString(paths), 'image/svg+xml')
    .documentElement as unknown as SVGElement
}

export function pathsToCanvas(paths: Path2D[], options: Partial<PathStyle & { pixelRatio: number }> = {}): HTMLCanvasElement {
  const { pixelRatio = 2, ...style } = options
  const { left, top, width, height } = getPathsBoundingBox(paths)!
  const canvas = document.createElement('canvas')
  canvas.width = width * pixelRatio
  canvas.height = height * pixelRatio
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(pixelRatio, pixelRatio)
    ctx.translate(-left, -top)
    paths.forEach((path) => {
      path.drawTo(ctx, style)
    })
  }
  return canvas
}
