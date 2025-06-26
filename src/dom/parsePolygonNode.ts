import { Path2D } from '../core'
import { parseFloatWithUnits } from './parseFloatWithUnits'

const RE = /([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g

export function parsePolygonNode(node: SVGPolygonElement): Path2D {
  const path = new Path2D()
  let index = 0
  node.getAttribute('points')?.replace(RE, (match: string, a: number, b: number) => {
    const x = parseFloatWithUnits(a)
    const y = parseFloatWithUnits(b)
    if (index === 0) {
      path.moveTo(x, y)
    }
    else {
      path.lineTo(x, y)
    }
    index++
    return match
  })
  path.currentCurve.autoClose = true
  return path
}
