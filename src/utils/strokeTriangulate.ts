import type { Path2DStyle } from '../types'

export type LineCap = 'butt' | 'round' | 'square'
export type LineJoin = 'round' | 'bevel' | 'miter'

export interface StrokeTriangulateOptions {
  vertices?: number[]
  indices?: number[]
  /**
   * When provided, receives one UV pair per generated vertex: u = cumulative
   * arc length (in path units, unnormalized) along this subpath's centerline,
   * v = position across the stroke width (0/1 at the two boundaries, 0.5 on
   * the centerline — round join/cap fan centers). Enables along-the-path
   * fragment effects (flow pulses, dashes, gradients) with consistent physical
   * scale across paths of different lengths, and screen-space edge feathering,
   * without re-triangulating.
   */
  uvs?: number[]
  lineStyle?: LineStyle
  flipAlignment?: boolean
  closed?: boolean
  style?: Partial<Path2DStyle>
}

export interface StrokeTriangulatedResult {
  vertices: number[]
  indices: number[]
  uvs?: number[]
}

export interface LineStyle {
  width: number
  alignment: number
  join: LineJoin
  cap: LineCap
  miterLimit: number
}

/**
 * Map an SVG/canvas `strokeLinejoin` onto the three joins the triangulator supports.
 * `arcs`/`miter-clip` (rarely implemented even by browsers) degrade to `miter`.
 */
function resolveLineJoin(join?: string): LineJoin {
  switch (join) {
    case 'round':
    case 'bevel':
    case 'miter':
      return join
    default:
      return 'miter'
  }
}

/**
 * Derive a triangulator {@link LineStyle} from a (partial) {@link Path2DStyle}. This is what
 * makes `path.strokeTriangulate()` honor `style.strokeWidth` / `strokeLinejoin` / `strokeLinecap`
 * / `strokeMiterlimit` instead of silently falling back to a 1px miter hairline.
 */
export function resolveLineStyle(style?: Partial<Path2DStyle>): LineStyle {
  return {
    width: style?.strokeWidth ?? 1,
    alignment: 0.5,
    join: resolveLineJoin(style?.strokeLinejoin),
    cap: style?.strokeLinecap ?? 'butt',
    miterLimit: style?.strokeMiterlimit ?? 10,
  }
}

const closePointEps = 1e-4
const curveEps = 0.0001

export function strokeTriangulate(
  points: number[],
  options: StrokeTriangulateOptions = {},
): StrokeTriangulatedResult {
  const {
    vertices = [],
    indices = [],
    flipAlignment = false,
    closed = true,
  } = options

  // Explicit `lineStyle` wins; otherwise derive from the path's `style` (so strokeWidth/join/cap
  // are respected); otherwise fall back to a 1px miter hairline.
  const lineStyle = options.lineStyle ?? resolveLineStyle(options.style)

  const eps = closePointEps

  if (points.length === 0) {
    return { vertices, indices }
  }

  // Collapse consecutive duplicate points. Sub-curve seams (e.g. two arcs meeting, or a
  // degenerate closing line) leave coincident vertices; the zero-length segments make the
  // perpendicular/miter math divide by ~0 and spray spikes at the seam.
  points = dedupeConsecutivePoints(points, eps)
  if (points.length < 4) {
    return { vertices, indices }
  }

  const style = lineStyle

  let alignment = style.alignment

  if (lineStyle.alignment !== 0.5) {
    // rotate the points!
    let orientation = getOrientationOfPoints(points)

    if (flipAlignment)
      orientation *= -1

    alignment = ((alignment - 0.5) * orientation) + 0.5
  }

  // get first and last point.. figure out the middle!
  const firstPoint = { x: points[0], y: points[1] }
  const lastPoint = { x: points[points.length - 2], y: points[points.length - 1] }
  const closedShape = closed
  const closedPath = Math.abs(firstPoint.x - lastPoint.x) < eps
    && Math.abs(firstPoint.y - lastPoint.y) < eps

  // if the first point is the last point - gonna have issues :)
  if (closedShape) {
    // need to clone as we are going to slightly modify the shape..
    points = points.slice()

    if (closedPath) {
      points.pop()
      points.pop()
      lastPoint.x = points[points.length - 2]
      lastPoint.y = points[points.length - 1]
    }

    const midPointX = (firstPoint.x + lastPoint.x) * 0.5
    const midPointY = (lastPoint.y + firstPoint.y) * 0.5

    points.unshift(midPointX, midPointY)
    points.push(midPointX, midPointY)
  }

  const verts = vertices

  // Along-the-path UVs: cumulative arc length (path units) per source point
  // (computed after dedupe + closed-shape midpoint insertion so indices line up
  // with `points`). `fillUvs(u)` stamps every vertex pushed since the last call
  // with that source point's arc length — join/cap fan vertices inherit their
  // corner's u, which is exact for flow effects (the whole fan sits at one
  // point of the centerline). v comes from vertex parity (the strip pushes
  // strict inner/outer pairs) except inside `round()`, whose fans interleave
  // centerline points — it writes its own uvs (center 0.5 / rim 0 or 1), so
  // every round() call site must sync the lag via fillUvs first.
  const uvs = options.uvs
  let arc: number[] | undefined
  if (uvs) {
    arc = [0]
    let acc = 0
    for (let i = 2; i < points.length; i += 2) {
      const dx = points[i] - points[i - 2]
      const dy = points[i + 1] - points[i - 1]
      acc += Math.sqrt(dx * dx + dy * dy)
      arc.push(acc)
    }
  }
  const fillUvs = (u: number): void => {
    if (!uvs)
      return
    while (uvs.length < verts.length) {
      uvs.push(u, (uvs.length >>> 1) & 1)
    }
  }

  const length = points.length / 2
  let indexCount = points.length
  const indexStart = verts.length / 2

  // Max. inner and outer width
  const width = style.width / 2
  const widthSquared = width * width
  const miterLimitSquared = style.miterLimit * style.miterLimit

  /* Line segments of interest where (x1,y1) forms the corner. */
  let x0 = points[0]
  let y0 = points[1]
  let x1 = points[2]
  let y1 = points[3]
  let x2 = 0
  let y2 = 0

  /* perp[?](x|y) = the line normal with magnitude lineWidth. */
  let perpX = -(y0 - y1)
  let perpY = x0 - x1
  let perp1x = 0
  let perp1y = 0

  let dist = Math.sqrt((perpX * perpX) + (perpY * perpY))

  perpX /= dist
  perpY /= dist
  perpX *= width
  perpY *= width

  const ratio = alignment// 0.5;
  const innerWeight = (1 - ratio) * 2
  const outerWeight = ratio * 2

  if (!closedShape) {
    if (style.cap === 'round') {
      indexCount += round(
        x0 - (perpX * (innerWeight - outerWeight) * 0.5),
        y0 - (perpY * (innerWeight - outerWeight) * 0.5),
        x0 - (perpX * innerWeight),
        y0 - (perpY * innerWeight),
        x0 + (perpX * outerWeight),
        y0 + (perpY * outerWeight),
        verts,
        true,
        uvs,
        0,
      ) + 2
    }
    else if (style.cap === 'square') {
      indexCount += square(x0, y0, perpX, perpY, innerWeight, outerWeight, true, verts)
    }
  }

  // Push first point (below & above vertices)
  verts.push(
    x0 - (perpX * innerWeight),
    y0 - (perpY * innerWeight),
  )
  verts.push(
    x0 + (perpX * outerWeight),
    y0 + (perpY * outerWeight),
  )
  fillUvs(0)

  for (let i = 1; i < length - 1; ++i) {
    const cornerU = arc ? arc[i] : 0
    x0 = points[(i - 1) * 2]
    y0 = points[((i - 1) * 2) + 1]

    x1 = points[i * 2]
    y1 = points[(i * 2) + 1]

    x2 = points[(i + 1) * 2]
    y2 = points[((i + 1) * 2) + 1]

    perpX = -(y0 - y1)
    perpY = x0 - x1

    dist = Math.sqrt((perpX * perpX) + (perpY * perpY))
    perpX /= dist
    perpY /= dist
    perpX *= width
    perpY *= width

    perp1x = -(y1 - y2)
    perp1y = x1 - x2

    dist = Math.sqrt((perp1x * perp1x) + (perp1y * perp1y))
    perp1x /= dist
    perp1y /= dist
    perp1x *= width
    perp1y *= width

    /* d[x|y](0|1) = the component displacement between points p(0,1|1,2) */
    const dx0 = x1 - x0
    const dy0 = y0 - y1
    const dx1 = x1 - x2
    const dy1 = y2 - y1

    /* +ve if internal angle < 90 degree, -ve if internal angle > 90 degree. */
    const dot = (dx0 * dx1) + (dy0 * dy1)
    /* +ve if internal angle counterclockwise, -ve if internal angle clockwise. */
    const cross = (dy0 * dx1) - (dy1 * dx0)
    const clockwise = (cross < 0)

    /* Going nearly parallel? */
    /* atan(0.001) ~= 0.001 rad ~= 0.057 degree */
    if (Math.abs(cross) < 0.001 * Math.abs(dot)) {
      verts.push(
        x1 - (perpX * innerWeight),
        y1 - (perpY * innerWeight),
      )
      verts.push(
        x1 + (perpX * outerWeight),
        y1 + (perpY * outerWeight),
      )

      /* 180 degree corner? */
      if (dot >= 0) {
        if (style.join === 'round') {
          fillUvs(cornerU)
          indexCount += round(
            x1,
            y1,
            x1 - (perpX * innerWeight),
            y1 - (perpY * innerWeight),
            x1 - (perp1x * innerWeight),
            y1 - (perp1y * innerWeight),
            verts,
            false,
            uvs,
            cornerU,
          ) + 4
        }
        else {
          indexCount += 2
        }

        verts.push(
          x1 - (perp1x * outerWeight),
          y1 - (perp1y * outerWeight),
        )
        verts.push(
          x1 + (perp1x * innerWeight),
          y1 + (perp1y * innerWeight),
        )
      }

      fillUvs(arc ? arc[i] : 0)
      continue
    }

    /* p[x|y] is the miter point. pDist is the distance between miter point and p1. */
    const c1 = ((-perpX + x0) * (-perpY + y1)) - ((-perpX + x1) * (-perpY + y0))
    const c2 = ((-perp1x + x2) * (-perp1y + y1)) - ((-perp1x + x1) * (-perp1y + y2))
    const px = ((dx0 * c2) - (dx1 * c1)) / cross
    const py = ((dy1 * c1) - (dy0 * c2)) / cross
    const pDist = ((px - x1) * (px - x1)) + ((py - y1) * (py - y1))

    /* Inner miter point */
    const imx = x1 + ((px - x1) * innerWeight)
    const imy = y1 + ((py - y1) * innerWeight)
    /* Outer miter point */
    const omx = x1 - ((px - x1) * outerWeight)
    const omy = y1 - ((py - y1) * outerWeight)

    /* Is the inside miter point too far away, creating a spike? */
    const smallerInsideSegmentSq = Math.min((dx0 * dx0) + (dy0 * dy0), (dx1 * dx1) + (dy1 * dy1))
    const insideWeight = clockwise ? innerWeight : outerWeight
    const smallerInsideDiagonalSq = smallerInsideSegmentSq + (insideWeight * insideWeight * widthSquared)
    const insideMiterOk = pDist <= smallerInsideDiagonalSq

    if (insideMiterOk) {
      if (style.join === 'bevel' || pDist / widthSquared > miterLimitSquared) {
        if (clockwise) {
          /* rotating at inner angle */
          verts.push(imx, imy) // inner miter point
          verts.push(x1 + (perpX * outerWeight), y1 + (perpY * outerWeight)) // first segment's outer vertex
          verts.push(imx, imy) // inner miter point
          verts.push(x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight)) // second segment's outer vertex
        }
        else {
          /* rotating at outer angle */
          verts.push(x1 - (perpX * innerWeight), y1 - (perpY * innerWeight)) // first segment's inner vertex
          verts.push(omx, omy) // outer miter point
          verts.push(x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight)) // second segment's outer vertex
          verts.push(omx, omy) // outer miter point
        }

        indexCount += 2
      }
      else if (style.join === 'round') {
        if (clockwise) {
          /* arc is outside */
          verts.push(imx, imy)
          verts.push(x1 + (perpX * outerWeight), y1 + (perpY * outerWeight))
          fillUvs(cornerU)

          indexCount += round(
            x1,
            y1,
            x1 + (perpX * outerWeight),
            y1 + (perpY * outerWeight),
            x1 + (perp1x * outerWeight),
            y1 + (perp1y * outerWeight),
            verts,
            true,
            uvs,
            cornerU,
          ) + 4

          verts.push(imx, imy)
          verts.push(x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight))
        }
        else {
          /* arc is inside */
          verts.push(x1 - (perpX * innerWeight), y1 - (perpY * innerWeight))
          verts.push(omx, omy)
          fillUvs(cornerU)

          indexCount += round(
            x1,
            y1,
            x1 - (perpX * innerWeight),
            y1 - (perpY * innerWeight),
            x1 - (perp1x * innerWeight),
            y1 - (perp1y * innerWeight),
            verts,
            false,
            uvs,
            cornerU,
          ) + 4

          verts.push(x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight))
          verts.push(omx, omy)
        }
      }
      else {
        verts.push(imx, imy)
        verts.push(omx, omy)
      }
    }
    else {
      // inside miter is NOT ok
      verts.push(x1 - (perpX * innerWeight), y1 - (perpY * innerWeight)) // first segment's inner vertex
      verts.push(x1 + (perpX * outerWeight), y1 + (perpY * outerWeight)) // first segment's outer vertex
      if (style.join === 'round') {
        fillUvs(cornerU)
        if (clockwise) {
          /* arc is outside */
          indexCount += round(
            x1,
            y1,
            x1 + (perpX * outerWeight),
            y1 + (perpY * outerWeight),
            x1 + (perp1x * outerWeight),
            y1 + (perp1y * outerWeight),
            verts,
            true,
            uvs,
            cornerU,
          ) + 2
        }
        else {
          /* arc is inside */
          indexCount += round(
            x1,
            y1,
            x1 - (perpX * innerWeight),
            y1 - (perpY * innerWeight),
            x1 - (perp1x * innerWeight),
            y1 - (perp1y * innerWeight),
            verts,
            false,
            uvs,
            cornerU,
          ) + 2
        }
      }
      else if (style.join === 'miter' && pDist / widthSquared <= miterLimitSquared) {
        if (clockwise) {
          verts.push(omx, omy) // inner miter point
          verts.push(omx, omy) // inner miter point
        }
        else {
          verts.push(imx, imy) // outer miter point
          verts.push(imx, imy) // outer miter point
        }
        indexCount += 2
      }
      verts.push(x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight)) // second segment's inner vertex
      verts.push(x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight)) // second segment's outer vertex
      indexCount += 2
    }

    fillUvs(arc ? arc[i] : 0)
  }

  x0 = points[(length - 2) * 2]
  y0 = points[((length - 2) * 2) + 1]

  x1 = points[(length - 1) * 2]
  y1 = points[((length - 1) * 2) + 1]

  perpX = -(y0 - y1)
  perpY = x0 - x1

  dist = Math.sqrt((perpX * perpX) + (perpY * perpY))
  perpX /= dist
  perpY /= dist
  perpX *= width
  perpY *= width

  verts.push(x1 - (perpX * innerWeight), y1 - (perpY * innerWeight))
  verts.push(x1 + (perpX * outerWeight), y1 + (perpY * outerWeight))

  if (!closedShape) {
    if (style.cap === 'round') {
      fillUvs(arc ? arc[length - 1] : 0)
      indexCount += round(
        x1 - (perpX * (innerWeight - outerWeight) * 0.5),
        y1 - (perpY * (innerWeight - outerWeight) * 0.5),
        x1 - (perpX * innerWeight),
        y1 - (perpY * innerWeight),
        x1 + (perpX * outerWeight),
        y1 + (perpY * outerWeight),
        verts,
        false,
        uvs,
        arc ? arc[length - 1] : 0,
      ) + 2
    }
    else if (style.cap === 'square') {
      indexCount += square(x1, y1, perpX, perpY, innerWeight, outerWeight, false, verts)
    }
  }

  if (uvs && arc) {
    fillUvs(arc[length - 1])
  }

  // const indices = graphicsGeometry.indices;
  const eps2 = curveEps * curveEps

  // indices.push(indexStart);
  for (let i = indexStart; i < indexCount + indexStart - 2; ++i) {
    x0 = verts[(i * 2)]
    y0 = verts[(i * 2) + 1]

    x1 = verts[(i + 1) * 2]
    y1 = verts[((i + 1) * 2) + 1]

    x2 = verts[(i + 2) * 2]
    y2 = verts[((i + 2) * 2) + 1]

    /* Skip zero area triangles */
    if (Math.abs((x0 * (y1 - y2)) + (x1 * (y2 - y0)) + (x2 * (y0 - y1))) < eps2) {
      continue
    }

    indices.push(i, i + 1, i + 2)
  }

  return {
    vertices,
    indices,
    uvs,
  }
}

/**
 * Return a copy of the flat point list with consecutive near-coincident points removed
 * (distance < `eps`). Keeps the first occurrence; does not touch the first/last wrap so the
 * caller's closed-path detection still works.
 */
function dedupeConsecutivePoints(points: number[], eps: number): number[] {
  const out: number[] = [points[0], points[1]]
  for (let i = 2; i < points.length; i += 2) {
    const x = points[i]
    const y = points[i + 1]
    if (Math.abs(x - out[out.length - 2]) >= eps || Math.abs(y - out[out.length - 1]) >= eps) {
      out.push(x, y)
    }
  }
  return out
}

function getOrientationOfPoints(points: number[]): number {
  const m = points.length
  if (m < 6) {
    return 1
  }
  let area = 0
  for (let i = 0, x1 = points[m - 2], y1 = points[m - 1]; i < m; i += 2) {
    const x2 = points[i]
    const y2 = points[i + 1]
    area += (x2 - x1) * (y2 + y1)
    x1 = x2
    y1 = y2
  }
  if (area < 0) {
    return -1
  }
  return 1
}

function square(
  x: number,
  y: number,
  nx: number,
  ny: number,
  innerWeight: number,
  outerWeight: number,
  clockwise: boolean, /* rotation for square (true at left end, false at right end) */
  verts: number[],
): number {
  const ix = x - (nx * innerWeight)
  const iy = y - (ny * innerWeight)
  const ox = x + (nx * outerWeight)
  const oy = y + (ny * outerWeight)
  /* Rotate nx,ny for extension vector */
  let exx
  let eyy
  if (clockwise) {
    exx = ny
    eyy = -nx
  }
  else {
    exx = -ny
    eyy = nx
  }
  /* [i|0]x,y extended at cap */
  const eix = ix + exx
  const eiy = iy + eyy
  const eox = ox + exx
  const eoy = oy + eyy
  /* Square itself must be inserted clockwise */
  verts.push(eix, eiy)
  verts.push(eox, eoy)
  return 2
}

function round(
  cx: number,
  cy: number,
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  verts: number[],
  clockwise: boolean, /* if not cap, then clockwise is turn of joint, otherwise rotation from angle0 to angle1 */
  uvs?: number[],
  u = 0, /* arc-length u stamped on every fan vertex (the fan sits at one centerline point) */
): number {
  const cx2p0x = sx - cx
  const cy2p0y = sy - cy
  let angle0 = Math.atan2(cx2p0x, cy2p0y)
  let angle1 = Math.atan2(ex - cx, ey - cy)
  if (clockwise && angle0 < angle1) {
    angle0 += Math.PI * 2
  }
  else if (!clockwise && angle0 > angle1) {
    angle1 += Math.PI * 2
  }
  let startAngle = angle0
  const angleDiff = angle1 - angle0
  const absAngleDiff = Math.abs(angleDiff)
  const radius = Math.sqrt((cx2p0x * cx2p0x) + (cy2p0y * cy2p0y))
  const segCount = ((15 * absAngleDiff * Math.sqrt(radius) / Math.PI) >> 0) + 1
  const angleInc = angleDiff / segCount
  startAngle += angleInc
  // fan center (cx,cy) sits on the stroke centerline → v=0.5; rim points sit on
  // the boundary → v=1 (outer arc, clockwise) or 0 (inner arc). Callers sync any
  // lagging uvs before invoking, so pushing per pair here stays aligned.
  if (clockwise) {
    verts.push(cx, cy)
    verts.push(sx, sy)
    uvs?.push(u, 0.5, u, 1)
    for (let i = 1, angle = startAngle; i < segCount; i++, angle += angleInc) {
      verts.push(cx, cy)
      verts.push(cx + ((Math.sin(angle) * radius)), cy + ((Math.cos(angle) * radius)))
      uvs?.push(u, 0.5, u, 1)
    }
    verts.push(cx, cy)
    verts.push(ex, ey)
    uvs?.push(u, 0.5, u, 1)
  }
  else {
    verts.push(sx, sy)
    verts.push(cx, cy)
    uvs?.push(u, 0, u, 0.5)
    for (let i = 1, angle = startAngle; i < segCount; i++, angle += angleInc) {
      verts.push(cx + ((Math.sin(angle) * radius)), cy + ((Math.cos(angle) * radius)))
      verts.push(cx, cy)
      uvs?.push(u, 0, u, 0.5)
    }
    verts.push(ex, ey)
    verts.push(cx, cy)
    uvs?.push(u, 0, u, 0.5)
  }
  return segCount * 2
}
