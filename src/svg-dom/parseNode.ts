import type { Path2D } from '../paths'
import { Matrix3 } from '../math'
import { getNodeTransform } from './getNodeTransform'
import { parseCircleNode } from './parseCircleNode'
import { parseCSSStylesheet } from './parseCSSStylesheet'
import { parseEllipseNode } from './parseEllipseNode'
import { parseLineNode } from './parseLineNode'
import { parsePathNode } from './parsePathNode'
import { parsePolygonNode } from './parsePolygonNode'
import { parsePolylineNode } from './parsePolylineNode'
import { parseRectNode } from './parseRectNode'
import { parseStyle } from './parseStyle'

export function parseNode(
  node: SVGElement,
  style: Record<string, any>,
  paths: Path2D[] = [],
): Path2D[] {
  if (node.nodeType !== 1)
    return paths

  let isDefsNode = false
  let path: Path2D | null = null
  let _style = { ...style }
  const stylesheets: Record<string, any> = {}

  switch (node.nodeName) {
    case 'svg':
      _style = parseStyle(node, _style, stylesheets)
      break
    case 'style':
      parseCSSStylesheet(node as SVGStyleElement, stylesheets)
      break
    case 'g':
      _style = parseStyle(node, _style, stylesheets)
      break
    case 'path':
      _style = parseStyle(node, _style, stylesheets)
      if (node.hasAttribute('d'))
        path = parsePathNode(node as SVGPathElement)
      break
    case 'rect':
      _style = parseStyle(node, _style, stylesheets)
      path = parseRectNode(node as SVGRectElement)
      break
    case 'polygon':
      _style = parseStyle(node, _style, stylesheets)
      path = parsePolygonNode(node as SVGPolygonElement)
      break
    case 'polyline':
      _style = parseStyle(node, _style, stylesheets)
      path = parsePolylineNode(node as SVGPolylineElement)
      break
    case 'circle':
      _style = parseStyle(node, _style, stylesheets)
      path = parseCircleNode(node as SVGCircleElement)
      break
    case 'ellipse':
      _style = parseStyle(node, _style, stylesheets)
      path = parseEllipseNode(node as SVGEllipseElement)
      break
    case 'line':
      _style = parseStyle(node, _style, stylesheets)
      path = parseLineNode(node as SVGLineElement)
      break
    case 'defs':
      isDefsNode = true
      break
    case 'use': {
      _style = parseStyle(node, _style, stylesheets)
      const href = node.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || ''
      const usedNodeId = href.substring(1)
      const usedNode = (node.viewportElement as any)?.getElementById(usedNodeId)
      if (usedNode) {
        parseNode(usedNode, _style, paths)
      }
      else {
        console.warn(`'use node' references non-existent node id: ${usedNodeId}`)
      }
      break
    }
    default:
      console.warn(node)
      break
  }

  if (_style.display === 'none') {
    return paths
  }

  Object.assign(style, _style)

  const currentTransform = new Matrix3()
  const transformStack: Matrix3[] = []
  const transform = getNodeTransform(node, currentTransform, transformStack)
  if (path) {
    path.matrix(currentTransform)
    paths.push(path)
    path.style = style
  }

  const childNodes = node.childNodes
  for (let i = 0, len = childNodes.length; i < len; i++) {
    const node = childNodes[i]
    if (isDefsNode && node.nodeName !== 'style' && node.nodeName !== 'defs')
      continue
    parseNode(node as SVGElement, style, paths)
  }

  if (transform) {
    transformStack.pop()
    if (transformStack.length > 0) {
      currentTransform.copy(transformStack[transformStack.length - 1])
    }
    else {
      currentTransform.identity()
    }
  }

  return paths
}
