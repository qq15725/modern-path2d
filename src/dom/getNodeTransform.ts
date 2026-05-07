import { Transform2D } from '../math'
import { parseFloatWithUnits } from './parseFloatWithUnits'

export function getNodeTransform(node: SVGElement, currentTransform: Transform2D, transformStack: Transform2D[]): Transform2D | null {
  if (!(node.hasAttribute('transform') || (node.nodeName === 'use' && (node.hasAttribute('x') || node.hasAttribute('y'))))) {
    return null
  }
  const transform = parseNodeTransform(node)
  if (transformStack.length > 0) {
    transform.prepend(transformStack[transformStack.length - 1])
  }
  currentTransform.copyFrom(transform)
  transformStack.push(transform)
  return transform
}

function parseNodeTransform(node: SVGElement): Transform2D {
  const transform = new Transform2D()

  if (node.nodeName === 'use' && (node.hasAttribute('x') || node.hasAttribute('y'))) {
    transform.translate(
      parseFloatWithUnits(node.getAttribute('x')),
      parseFloatWithUnits(node.getAttribute('y')),
    )
  }

  if (node.hasAttribute('transform')) {
    transform.prependCssTransform(node.getAttribute('transform')!)
  }

  return transform
}
