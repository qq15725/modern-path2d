import { drawPoint, Path2D, Path2DSet, svgToPath2DSet } from '../src'

function genCtx(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas')
  canvas.style.width = '100px'
  canvas.style.height = '100px'
  canvas.width = 2000
  canvas.height = 2000
  document.body.append(canvas)
  const ctx = canvas.getContext('2d')!
  ctx.scale(10, 10)
  return ctx
}

function drawPath2D(path: Path2D): void {
  // rect
  path.rect(10, 10, 100, 100)
  path.roundRect(40, 40, 100, 100, 10)

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
}

function testWebPath2D(): void {
  const path1 = new Path2D()
  const path2 = new window.Path2D()
  ;[path1, path2].forEach(path => drawPath2D(path as any))
  path1.style.stroke = 'currentColor'
  path1.style.fill = 'none'
  path1.drawTo(genCtx())
  genCtx().stroke(path2)

  document.body.append(new Path2DSet([path1]).toTriangulatedSVG(
    path1.strokeTriangulate(),
  ))
}

async function testSVGFixtures(): Promise<void> {
  for (const [key, value] of Object.entries(import.meta.glob('../test/fixtures/*.svg', { query: '?raw' }))) {
    const svgSource = await (value as () => Promise<any>)().then(rep => rep.default)
    const pathSet = svgToPath2DSet(svgSource)

    const canvas = pathSet.toCanvas()
    canvas.dataset.file = key
    document.body.append(canvas)

    const svg = pathSet.toSVG()
    svg.dataset.file = key
    document.body.append(svg)

    const triangulatedSVG = pathSet.toTriangulatedSVG(
      pathSet.paths.map(p => p.fillTriangulate()),
    )
    triangulatedSVG.dataset.file = key
    document.body.append(triangulatedSVG)

    console.warn(pathSet)

    const ctx = genCtx()
    ctx.fillStyle = 'red'
    for (const path of pathSet.paths) {
      const { vertices } = path.fillTriangulate()
      for (let i = 0; i < vertices.length; i += 2) {
        const p = {
          x: vertices[i],
          y: vertices[i + 1],
        }
        drawPoint(ctx, p.x + 10, p.y + 10, { radius: 0.3 })
        ctx.fill()
      }
    }
  }
}

async function testJSONFixtures(): Promise<void> {
  for (const [key, value] of Object.entries(import.meta.glob('../test/fixtures/*.json'))) {
    const commands = await (value as () => Promise<any>)().then(rep => rep.default)
    const path = new Path2D(commands)
    path
      .bold(0.5)
      .scale(2)
      .skew(-0.24)
      .rotate(90)
    const canvas = new Path2DSet([path]).toCanvas()
    canvas.dataset.file = key
    document.body.append(canvas)
  }
}

async function testPoints(): Promise<void> {
  const ctx = genCtx()
  ctx.fillStyle = 'red'
  const path = new Path2D()
  drawPath2D(path)
  const points = path.getAdaptivePoints()
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    drawPoint(ctx, p.x, p.y, { radius: 4 })
    ctx.fill()
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

async function main(): Promise<void> {
  testWebPath2D()
  await testJSONFixtures()
  await testSVGFixtures()
  await testPoints()
}

main()
