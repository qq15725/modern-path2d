import { parseSvg, Path2D } from '../src'

function createCtx(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  document.body.append(canvas)
  return canvas.getContext('2d')!
}

function testWebPath2D(): void {
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
  path1.style.stroke = 'currentColor'
  path1.style.fill = 'none'
  path1.drawTo(createCtx())
  createCtx().stroke(path2)
}

async function testSvgFixtures(): Promise<void> {
  for (const [key, value] of Object.entries(import.meta.glob('../test/fixtures/*.svg', { query: '?raw' }))) {
    const svg = await (value as () => Promise<any>)().then(rep => rep.default)
    parseSvg(svg).forEach((path) => {
      console.warn(path)

      const canvas = path.toCanvas()
      canvas.dataset.file = key
      document.body.append(canvas)

      const svg = path.toSvg()
      svg.dataset.file = key
      document.body.append(svg)
    })
  }
}

async function testJsonFixtures(): Promise<void> {
  for (const [key, value] of Object.entries(import.meta.glob('../test/fixtures/*.json'))) {
    const commands = await (value as () => Promise<any>)().then(rep => rep.default)
    const canvas = new Path2D(commands).toCanvas()
    canvas.dataset.file = key
    document.body.append(canvas)
  }
}

async function main(): Promise<void> {
  testWebPath2D()
  await testJsonFixtures()
  await testSvgFixtures()
}

main()
