import { Matrix3 } from '../math'
import { parsePathDataArgs } from '../methods/parsePathDataArgs'
import { parseFloatWithUnits } from './parseFloatWithUnits'

const tempTransform0 = new Matrix3()
const tempTransform1 = new Matrix3()
const tempTransform2 = new Matrix3()
const tempTransform3 = new Matrix3()

export function getNodeTransform(node: SVGElement, currentTransform: Matrix3, transformStack: Matrix3[]): Matrix3 | null {
  if (!(node.hasAttribute('transform') || (node.nodeName === 'use' && (node.hasAttribute('x') || node.hasAttribute('y'))))) {
    return null
  }
  const transform = parseNodeTransform(node)
  if (transformStack.length > 0) {
    transform.premultiply(transformStack[transformStack.length - 1])
  }
  currentTransform.copy(transform)
  transformStack.push(transform)
  return transform
}

function parseNodeTransform(node: SVGElement): Matrix3 {
  const transform = new Matrix3()
  const currentTransform = tempTransform0

  if (node.nodeName === 'use' && (node.hasAttribute('x') || node.hasAttribute('y'))) {
    transform.translate(
      parseFloatWithUnits(node.getAttribute('x')),
      parseFloatWithUnits(node.getAttribute('y')),
    )
  }

  if (node.hasAttribute('transform')) {
    const transformsTexts = node.getAttribute('transform')!.split(')')
    for (let tIndex = transformsTexts.length - 1; tIndex >= 0; tIndex--) {
      const transformText = transformsTexts[tIndex].trim()
      if (transformText === '')
        continue
      const openParPos = transformText.indexOf('(')
      const closeParPos = transformText.length
      if (openParPos > 0 && openParPos < closeParPos) {
        const transformType = transformText.slice(0, openParPos)
        const array = parsePathDataArgs(transformText.slice(openParPos + 1))
        currentTransform.identity()
        switch (transformType) {
          case 'translate':
            if (array.length >= 1) {
              const tx = array[0]
              let ty = 0
              if (array.length >= 2) {
                ty = array[1]
              }
              currentTransform.translate(tx, ty)
            }
            break
          case 'rotate':
            if (array.length >= 1) {
              let angle = 0
              let cx = 0
              let cy = 0
              // Angle
              angle = array[0] * Math.PI / 180
              if (array.length >= 3) {
                cx = array[1]
                cy = array[2]
              }
              // Rotate around center (cx, cy)
              tempTransform1.makeTranslation(-cx, -cy)
              tempTransform2.makeRotation(angle)
              tempTransform3.multiplyMatrices(tempTransform2, tempTransform1)
              tempTransform1.makeTranslation(cx, cy)
              currentTransform.multiplyMatrices(tempTransform1, tempTransform3)
            }
            break
          case 'scale':
            if (array.length >= 1) {
              currentTransform.scale(
                array[0],
                array[1] ?? array[0],
              )
            }
            break
          case 'skewX':
            if (array.length === 1) {
              currentTransform.set(
                1,
                Math.tan(array[0] * Math.PI / 180),
                0,
                0,
                1,
                0,
                0,
                0,
                1,
              )
            }
            break
          case 'skewY':
            if (array.length === 1) {
              currentTransform.set(
                1,
                0,
                0,
                Math.tan(array[0] * Math.PI / 180),
                1,
                0,
                0,
                0,
                1,
              )
            }
            break
          case 'matrix':
            if (array.length === 6) {
              currentTransform.set(
                array[0],
                array[2],
                array[4],
                array[1],
                array[3],
                array[5],
                0,
                0,
                1,
              )
            }
            break
        }
      }
      transform.premultiply(currentTransform)
    }
  }
  return transform
}
