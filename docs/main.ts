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

  document.body.append(new Path2DSet([path1]).toTriangulatedSvg(path1.strokeTriangulate()))
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

function testPath(): void {
  const path = new Path2D()
  path.addData('M 85.4 36.89999999999999 L 14.3 36.89999999999999 L 14.3 45.8 L 7.2 45.8 L 7.2 30.599999999999994 L 47.2 30.599999999999994 Q 45.6 26.69999999999999 43.800000000000004 23.599999999999994 L 51 21.89999999999999 Q 52.2 23.799999999999997 53.45 26.19999999999999 Q 54.7 28.599999999999994 55.5 30.599999999999994 L 92.7 30.599999999999994 L 92.7 45.8 L 85.4 45.8 L 85.4 36.89999999999999 M 29.200000000000003 91 L 36 93.4 Q 31.5 98.9 24.75 103.8 Q 18 108.7 11.4 111.9 Q 10.700000000000001 110.8 9.05 109.1 Q 7.4 107.4 6.300000000000001 106.4 Q 12.8 103.8 19.1 99.7 Q 25.400000000000002 95.6 29.200000000000003 91 M 83.80000000000001 82.2 L 83.80000000000001 88.7 L 54.6 88.7 L 54.6 105.4 Q 54.6 108.3 53.85 109.8 Q 53.1 111.3 50.900000000000006 112.1 Q 48.7 112.8 45.1 112.95 Q 41.5 113.1 36.2 113.1 Q 35.9 111.5 35.25 109.8 Q 34.6 108.1 33.800000000000004 106.7 Q 38 106.8 41.25 106.85 Q 44.5 106.9 45.5 106.8 Q 46.6 106.7 47 106.4 Q 47.400000000000006 106.1 47.400000000000006 105.3 L 47.400000000000006 88.7 L 16.400000000000002 88.7 L 16.400000000000002 82.2 L 83.80000000000001 82.2 M 63.6 95.3 L 68.5 90.9 Q 72.7 93 77.35000000000001 95.75 Q 82 98.5 86.25 101.15 Q 90.5 103.8 93.30000000000001 106 L 88.2 111 Q 85.5 108.9 81.35000000000001 106.15 Q 77.2 103.4 72.55 100.5 Q 67.9 97.6 63.6 95.3 M 78.7 51.3 L 60.300000000000004 51.3 Q 64.4 57.699999999999996 69.8 62.5 Q 72.2 60.099999999999994 74.5 57.15 Q 76.80000000000001 54.199999999999996 78.7 51.3 M 82.7 45.4 L 84 45 L 88.30000000000001 47.8 Q 85.7 52.699999999999996 82 57.599999999999994 Q 78.30000000000001 62.5 74.5 66.3 Q 79 69.69999999999999 84.5 72.19999999999999 Q 90 74.7 96.2 76.2 Q 95.10000000000001 77.2 93.85000000000001 78.95 Q 92.60000000000001 80.7 91.9 82.1 Q 84.80000000000001 80.1 78.75 77 Q 72.7 73.9 67.7 69.6 L 67.7 74.7 L 33.6 74.7 L 33.6 70.19999999999999 Q 28 75.4 21.450000000000003 79.1 Q 14.9 82.8 8.1 85.1 Q 7.5 83.9 6.45 82.3 Q 5.4 80.7 4.4 79.7 Q 8.8 78.3 13.15 76.3 Q 17.5 74.3 21.5 71.6 Q 19.900000000000002 70 17.95 68.3 Q 16 66.6 14 65.3 L 18.6 62.3 Q 20.6 63.599999999999994 22.6 65.19999999999999 Q 24.6 66.8 26.200000000000003 68.4 Q 27.6 67.3 28.900000000000002 66.15 Q 30.200000000000003 65 31.5 63.699999999999996 Q 29.8 62.199999999999996 27.700000000000003 60.699999999999996 Q 25.6 59.199999999999996 23.6 57.9 L 27.400000000000002 54.599999999999994 Q 29.400000000000002 55.599999999999994 31.400000000000002 57 Q 33.4 58.4 35.2 59.8 Q 37 57.699999999999996 38.45 55.349999999999994 Q 39.900000000000006 53 41.2 50.599999999999994 L 27 50.599999999999994 Q 23.6 54.599999999999994 19.1 58.199999999999996 Q 14.600000000000001 61.8 8.9 64.9 Q 8.200000000000001 63.699999999999996 7 62.349999999999994 Q 5.800000000000001 61 4.7 60.3 Q 13.3 56 19.05 50.25 Q 24.8 44.5 27.6 39.099999999999994 L 34.300000000000004 40.3 Q 33.6 41.599999999999994 32.75 42.849999999999994 Q 31.900000000000002 44.099999999999994 31.1 45.5 L 42.900000000000006 45.5 L 42.900000000000006 45.4 L 44.2 45.4 L 45.300000000000004 45.099999999999994 L 49.5 47.199999999999996 Q 47.300000000000004 53.4 43.7 58.65 Q 40.1 63.9 35.7 68.3 L 66.3 68.3 Q 54.6 57.599999999999994 48.7 40.89999999999999 L 54.6 39.3 Q 55.2 40.89999999999999 55.800000000000004 42.4 Q 56.400000000000006 43.9 57.1 45.4 L 82.7 45.4')
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
