import type { PathStyle, StrokeLinejoin } from '../types'

const lineJoinMap: Record<StrokeLinejoin, CanvasLineJoin> = {
  'arcs': 'bevel',
  'bevel': 'bevel',
  'miter': 'miter',
  'miter-clip': 'miter',
  'round': 'round',
}

export function setCanvasContext(
  ctx: CanvasRenderingContext2D,
  style: Partial<PathStyle>,
): void {
  const {
    fill = '#000',
    stroke = 'none',
    strokeWidth = stroke === 'none' ? 0 : 1,
    strokeLinecap = 'round',
    strokeLinejoin = 'miter',
    strokeMiterlimit = 0,
    strokeDasharray,
    strokeDashoffset = 0,
    shadowOffsetX = 0,
    shadowOffsetY = 0,
    shadowBlur = 0,
    shadowColor = 'rgba(0, 0, 0, 0)',
  } = style

  ctx.fillStyle = fill
  ctx.strokeStyle = stroke

  // stroke
  ctx.lineWidth = strokeWidth
  ctx.lineCap = strokeLinecap
  ctx.lineJoin = lineJoinMap[strokeLinejoin]
  ctx.miterLimit = strokeMiterlimit
  strokeDasharray && ctx.setLineDash(strokeDasharray)
  ctx.lineDashOffset = strokeDashoffset

  // shadow
  ctx.shadowOffsetX = shadowOffsetX
  ctx.shadowOffsetY = shadowOffsetY
  ctx.shadowBlur = shadowBlur
  ctx.shadowColor = shadowColor
}
