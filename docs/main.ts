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

  const paths = parseSvg(`data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUxLjM2NDYgNDUuODY0MkM0OS43ODA4IDQ2LjI3ODIgNDcuOTA2IDQ2LjcwNSA0NS44NTg4IDQ3LjA4NTdNNDUuODU4OCA0Ny4wODU3QzM0LjE2NDkgNDkuMjYwNyAxNi44NDg2IDQ5LjkzNDMgMTYuMDI3NyAzOC4xNDg0QzE1LjIyIDI2LjU1MzMgMzIuMjY0IDIyLjM2MzYgNDUuNjEzNSAyNC41NjI2QzUzLjYwMSAyNS44NzgzIDU3LjQ1MDcgMjkuNjIwOCA1Ny45Mjg1IDM0LjIzN0M1OC4yODExIDM3LjY0MzUgNTUuNzc4IDQzLjM3MDIgNDUuODU4OCA0Ny4wODU3Wk00NS44NTg4IDQ3LjA4NTdDNDIuMzM2NyA0OC40MDUxIDM3Ljg3OTUgNDkuNDcwOCAzMi4yODMgNTAuMDg5MSIgc3Ryb2tlPSIjRkZDMzAwIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=`)
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
