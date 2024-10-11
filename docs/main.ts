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

    // arcTo
    path.moveTo(200, 20)
    path.arcTo(200, 130, 50, 20, 40)

    // ellipse
    path.ellipse(100, 100, 50, 75, Math.PI / 4, 0, 2 * Math.PI)
  })

  path1.strokeTo(ctx1)
  ctx2.stroke(path2)

  const paths = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none">
<path d="M51.3646 45.8642C49.7808 46.2782 47.906 46.705 45.8588 47.0857M45.8588 47.0857C34.1649 49.2607 16.8486 49.9343 16.0277 38.1484C15.22 26.5533 32.264 22.3636 45.6135 24.5626C53.601 25.8783 57.4507 29.6208 57.9285 34.237C58.2811 37.6435 55.778 43.3702 45.8588 47.0857ZM45.8588 47.0857C42.3367 48.4051 37.8795 49.4708 32.283 50.0891" stroke="#FFC300" stroke-width="2.5" stroke-linecap="round"/>
</svg>`)
  console.warn(paths)
  paths.forEach(path => path1.addPath(path))

  const pathCommands = JSON.parse(await fetch('/char.json').then(rep => rep.text()))
  console.warn(pathCommands)
  path1.addCommands(pathCommands)

  ;(document.querySelector('svg path') as SVGPathElement).setAttribute('d', path1.getData())
  ;(document.querySelector('img') as HTMLImageElement).setAttribute('src', path1.getSvgDataUri())

  console.warn(path1.getBoundingBox())
}

main()
