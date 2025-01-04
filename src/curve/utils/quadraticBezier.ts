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
