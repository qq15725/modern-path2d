/**
 * Bezier Curves formulas obtained from
 * https://en.wikipedia.org/wiki/B%C3%A9zier_curve
 */
export function catmullRom(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const v0 = (p2 - p0) * 0.5
  const v1 = (p3 - p1) * 0.5
  const t2 = t * t
  const t3 = t * t2
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1
}

function quadraticBezierP0(t: number, p: number): number {
  const k = 1 - t
  return k * k * p
}

function quadraticBezierP1(t: number, p: number): number {
  return 2 * (1 - t) * t * p
}

function quadraticBezierP2(t: number, p: number): number {
  return t * t * p
}

export function quadraticBezier(t: number, p0: number, p1: number, p2: number): number {
  return quadraticBezierP0(t, p0)
    + quadraticBezierP1(t, p1)
    + quadraticBezierP2(t, p2)
}

function cubicBezierP0(t: number, p: number): number {
  const k = 1 - t
  return k * k * k * p
}

function cubicBezierP1(t: number, p: number): number {
  const k = 1 - t
  return 3 * k * k * t * p
}

function cubicBezierP2(t: number, p: number): number {
  return 3 * (1 - t) * t * t * p
}

function cubicBezierP3(t: number, p: number): number {
  return t * t * t * p
}

export function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  return cubicBezierP0(t, p0)
    + cubicBezierP1(t, p1)
    + cubicBezierP2(t, p2)
    + cubicBezierP3(t, p3)
}
