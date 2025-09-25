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

  document.body.append(
    new Path2DSet([path1]).toTriangulatedSvg({
      ...path1.strokeTriangulate(),
      points: path1.getControlPointRefs().flatMap(v => v.array),
    }),
  )
}

async function testSVGFixtures(): Promise<void> {
  for (const [key, value] of Object.entries(import.meta.glob('../test/fixtures/*.svg', { query: '?raw' }))) {
    const svgSource = await (value as () => Promise<any>)().then(rep => rep.default)
    const pathSet = svgToPath2DSet(svgSource)

    const canvas = pathSet.toCanvas()
    canvas.dataset.file = key
    document.body.append(canvas)

    const svg = pathSet.toSvg()
    svg.dataset.file = key
    document.body.append(svg)

    const triangulatedSVG = pathSet.toTriangulatedSvg(
      pathSet.paths.map((p) => {
        return {
          ...p.fillTriangulate(),
          points: p.getControlPointRefs().flatMap(v => v.array),
        }
      }),
    )
    triangulatedSVG.dataset.file = key
    document.body.append(triangulatedSVG)

    console.warn(pathSet)
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

function testPath(): void {
  const path = new Path2D()
  path.addData('M 35.300000000000004 50.599999999999994 L 64.10000000000001 50.599999999999994 L 64.10000000000001 44.3 L 35.300000000000004 44.3 L 35.300000000000004 50.599999999999994 M 27.200000000000003 38.099999999999994 L 72.7 38.099999999999994 L 72.7 56.8 L 27.200000000000003 56.8 L 27.200000000000003 38.099999999999994 M 66.3 69.19999999999999 L 33.2 69.19999999999999 L 33.2 87.1 L 24.900000000000002 87.1 L 24.900000000000002 62 L 74.9 62 L 74.9 86.4 L 66.3 86.4 L 66.3 69.19999999999999 M 46.300000000000004 71.8 L 54.400000000000006 71.8 L 54.400000000000006 77.7 Q 54.400000000000006 80.6 53.35 83.75 Q 52.300000000000004 86.9 49.2 90 Q 46.1 93.1 40.050000000000004 95.9 Q 34 98.7 24 101 Q 23.3 99.5 21.85 97.45 Q 20.400000000000002 95.4 19 94.1 Q 28.400000000000002 92.4 33.9 90.3 Q 39.400000000000006 88.2 42.050000000000004 85.95 Q 44.7 83.7 45.5 81.55 Q 46.300000000000004 79.4 46.300000000000004 77.5 L 46.300000000000004 71.8 M 52.400000000000006 90.7 L 56 84.7 Q 59.6 86 63.85 87.8 Q 68.10000000000001 89.6 72.10000000000001 91.35 Q 76.10000000000001 93.1 78.80000000000001 94.6 L 75.2 101.2 Q 72.60000000000001 99.8 68.7 97.95 Q 64.8 96.1 60.5 94.15 Q 56.2 92.2 52.400000000000006 90.7 M 17.2 33.599999999999994 L 17.2 102.8 L 82.60000000000001 102.8 L 82.60000000000001 33.599999999999994 L 17.2 33.599999999999994 M 8.200000000000001 113.8 L 8.200000000000001 25.89999999999999 L 92 25.89999999999999 L 92 113.8 L 82.60000000000001 113.8 L 82.60000000000001 110.3 L 17.2 110.3 L 17.2 113.8 L 8.200000000000001 113.8')
  path
    .bold(0.3 * 100 * 0.05)
    .scale(2)
    .skew(-0.24)
    .rotate(90)

  document.body.append(new Path2DSet([path]).toTriangulatedSvg(path.fillTriangulate()))
  document.body.append(new Path2DSet([path]).toTriangulatedSvg(path.strokeTriangulate()))
}

async function main(): Promise<void> {
  testWebPath2D()
  await testJSONFixtures()
  await testSVGFixtures()
  await testPath()
  await testPoints()
}

main()
