import { Path2D } from '../src'

const ctx1 = (document.getElementById('canvas1') as HTMLCanvasElement).getContext('2d')!
const ctx2 = (document.getElementById('canvas2') as HTMLCanvasElement).getContext('2d')!

const path1 = new Path2D()
const path2 = new window.Path2D()

;[path1, path2].forEach((path) => {
  // rect
  path.rect(10, 10, 100, 100)

  // arc
  path.arc(75, 75, 50, 0, Math.PI * 2, true) // 绘制
  path.moveTo(110, 75)
  path.arc(75, 75, 35, 0, Math.PI, false) // 口 (顺时针)
  path.moveTo(65, 65)
  path.arc(60, 65, 5, 0, Math.PI * 2, true) // 左眼
  path.moveTo(95, 65)
  path.arc(90, 65, 5, 0, Math.PI * 2, true) // 右眼

  // quadraticCurveTo
  path.moveTo(75, 25)
  path.quadraticCurveTo(25, 25, 25, 62.5)
  path.quadraticCurveTo(25, 100, 50, 100)
  path.quadraticCurveTo(50, 120, 30, 125)
  path.quadraticCurveTo(60, 120, 65, 100)
  path.quadraticCurveTo(125, 100, 125, 62.5)
  path.quadraticCurveTo(125, 25, 75, 25)

  // arcTo
  path.moveTo(200, 20)
  path.arcTo(200, 130, 50, 20, 40)

  // ellipse
  path.ellipse(100, 100, 50, 75, Math.PI / 4, 0, 2 * Math.PI)
})

ctx2.stroke(path2)

path1.strokeTo(ctx1)

;(document.querySelector('svg path') as SVGPathElement).setAttribute('d', path1.getData())
;(document.querySelector('img') as HTMLImageElement).setAttribute('src', path1.getSvgDataUri())

console.warn(path1.getBoundingBox())
