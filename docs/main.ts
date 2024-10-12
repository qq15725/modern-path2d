import { parseSvg, Path2D } from '../src'

async function main(): Promise<void> {
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

    // ellipse
    path.ellipse(100, 100, 50, 75, Math.PI / 4, 0, 2 * Math.PI)

    // arcTo
    path.moveTo(200, 20)
    path.arcTo(200, 130, 50, 20, 40)
  })

  path1.strokeTo(ctx1)
  ctx2.stroke(path2)
  console.warn(path1)

  const paths = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none">
<path d="M19.9277 47.3589H53.0078" stroke="#71E35B" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 8"/>
</svg>`)
  console.warn(paths)
  paths.forEach(path => path1.addPath(path))

  ;(document.querySelector('svg path') as SVGPathElement).setAttribute('d', path1.getData())
  ;(document.querySelector('img') as HTMLImageElement).setAttribute('src', path1.getSvgDataUri())

  console.warn(path1.getBoundingBox())

  document.body.append(
    new Path2D(JSON.parse(await fetch('/ni.json').then(rep => rep.text()))).toCanvas(),
  )

  document.body.append(
    new Path2D(JSON.parse(await fetch('/lian.json').then(rep => rep.text()))).toCanvas(),
  )
}

main()
