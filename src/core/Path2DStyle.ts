export type FillRule = 'nonzero' | 'evenodd'
export type StrokeLinecap = 'butt' | 'round' | 'square'
export type StrokeLinejoin = 'arcs' | 'bevel' | 'miter' | 'miter-clip' | 'round'

export interface Path2DDrawStyle {
  fill: string | any // CustomFillObject | CanvasGradient | CanvasPattern
  stroke: string | any // CustomStrokeObject | CanvasGradient | CanvasPattern
  shadowColor: string
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
}

export interface Path2DStyle extends Path2DDrawStyle {
  [key: string]: any
  // fill: string
  fillOpacity: number
  fillRule: FillRule
  opacity: number
  // stroke: string
  strokeOpacity: number
  strokeWidth: number
  strokeLinecap: StrokeLinecap
  strokeLinejoin: StrokeLinejoin
  strokeMiterlimit: number
  strokeDasharray: number[]
  strokeDashoffset: number
  visibility: string
}
