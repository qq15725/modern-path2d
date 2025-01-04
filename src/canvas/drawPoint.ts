export interface DrawPointOptions {
  radius?: number
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  options: DrawPointOptions = {},
): void {
  const { radius = 1 } = options
  ctx.moveTo(x, y)
  ctx.arc(x, y, radius, 0, Math.PI * 2)
}
