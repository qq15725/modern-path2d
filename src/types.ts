/**
 * @link https://developer.mozilla.org/docs/Web/SVG/Attribute/d
 */
export type Path2DCommand
  = | { type: 'm' | 'M', x: number, y: number }
    | { type: 'h' | 'H', x: number }
    | { type: 'v' | 'V', y: number }
    | { type: 'l' | 'L', x: number, y: number }
    | { type: 'c' | 'C', x1: number, y1: number, x2: number, y2: number, x: number, y: number }
    | { type: 's' | 'S', x2: number, y2: number, x: number, y: number }
    | { type: 'q' | 'Q', x1: number, y1: number, x: number, y: number }
    | { type: 't' | 'T', x: number, y: number }
    | { type: 'a' | 'A', rx: number, ry: number, angle: number, largeArcFlag: number, sweepFlag: number, x: number, y: number }
    | { type: 'z' | 'Z' }

/**
 * SVG path data
 *
 * @link https://developer.mozilla.org/docs/Web/SVG/Attribute/d
 */
export type Path2DData = string

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
