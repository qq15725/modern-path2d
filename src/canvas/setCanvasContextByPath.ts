import type { Path2D } from '../paths'
import type { StrokeLinejoin } from '../svg'

const lineJoinMap: Record<StrokeLinejoin, CanvasLineJoin> = {
  'arcs': 'bevel',
  'bevel': 'bevel',
  'miter': 'miter',
  'miter-clip': 'miter',
  'round': 'round',
}

export function setCanvasContextByPath(ctx: CanvasRenderingContext2D, path: Path2D): void {
  const {
    fill = '#000',
    stroke = 'none',
    strokeWidth = stroke === 'none' ? 0 : 1,
    strokeLinecap = 'round',
    strokeLinejoin = 'miter',
    strokeMiterlimit = 0,
    strokeDasharray,
    strokeDashoffset = 0,
  } = path.style
  ctx.fillStyle = fill
  ctx.strokeStyle = stroke
  ctx.lineWidth = strokeWidth
  ctx.lineCap = strokeLinecap
  ctx.lineJoin = lineJoinMap[strokeLinejoin]
  ctx.miterLimit = strokeMiterlimit
  ctx.lineDashOffset = strokeDashoffset
  strokeDasharray && ctx.setLineDash(strokeDasharray)
}
