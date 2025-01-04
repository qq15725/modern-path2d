import { Path2D } from '../../core'

/**
 * @link http://www.w3.org/TR/SVG11/implnote.html#PathElementImplementationNotes
 */
export function parsePathNode(node: SVGPathElement): Path2D | null {
  const path = new Path2D()
  const d = node.getAttribute('d')
  if (!d || d === 'none')
    return null
  path.addData(d)
  return path
}
