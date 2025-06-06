const RE = {
  SEPARATOR: /[ \t\r\n,.\-+]/,
  WHITESPACE: /[ \t\r\n]/,
  DIGIT: /\d/,
  SIGN: /[-+]/,
  POINT: /\./,
  COMMA: /,/,
  EXP: /e/i,
  FLAGS: /[01]/,
}

/**
 * from https://github.com/ppvg/svg-numbers (MIT License)
 */
export function parsePathDataArgs(input: string, flags?: number[], stride = 0): number[] {
  // States
  const SEP = 0
  const INT = 1
  const FLOAT = 2
  const EXP = 3

  let state = SEP
  let seenComma = true
  let number = ''
  let exponent = ''
  const result: number[] = []

  function throwSyntaxError(current: string, i: number, partial: any): void {
    const error = new SyntaxError(`Unexpected character "${current}" at index ${i}.`)
    ;(error as any).partial = partial
    throw error
  }

  function newNumber(): void {
    if (number !== '') {
      if (exponent === '')
        result.push(Number(number))
      else result.push(Number(number) * 10 ** Number(exponent))
    }

    number = ''
    exponent = ''
  }

  let current
  const length = input.length

  for (let i = 0; i < length; i++) {
    current = input[i]

    // check for flags
    if (Array.isArray(flags) && flags.includes(result.length % stride) && RE.FLAGS.test(current)) {
      state = INT
      number = current
      newNumber()
      continue
    }

    // parse until next number
    if (state === SEP) {
      // eat whitespace
      if (RE.WHITESPACE.test(current)) {
        continue
      }
      // start new number
      if (RE.DIGIT.test(current) || RE.SIGN.test(current)) {
        state = INT
        number = current
        continue
      }
      if (RE.POINT.test(current)) {
        state = FLOAT
        number = current
        continue
      }
      // throw on double commas (e.g. "1, , 2")
      if (RE.COMMA.test(current)) {
        if (seenComma) {
          throwSyntaxError(current, i, result)
        }
        seenComma = true
      }
    }

    // parse integer part
    if (state === INT) {
      if (RE.DIGIT.test(current)) {
        number += current
        continue
      }
      if (RE.POINT.test(current)) {
        number += current
        state = FLOAT
        continue
      }
      if (RE.EXP.test(current)) {
        state = EXP
        continue
      }
      // throw on double signs ("-+1"), but not on sign as separator ("-1-2")
      if (RE.SIGN.test(current)
        && number.length === 1
        && RE.SIGN.test(number[0])) {
        throwSyntaxError(current, i, result)
      }
    }

    // parse decimal part
    if (state === FLOAT) {
      if (RE.DIGIT.test(current)) {
        number += current
        continue
      }
      if (RE.EXP.test(current)) {
        state = EXP
        continue
      }
      // throw on double decimal points (e.g. "1..2")
      if (RE.POINT.test(current) && number[number.length - 1] === '.') {
        throwSyntaxError(current, i, result)
      }
    }

    // parse exponent part
    if (state === EXP) {
      if (RE.DIGIT.test(current)) {
        exponent += current
        continue
      }
      if (RE.SIGN.test(current)) {
        if (exponent === '') {
          exponent += current
          continue
        }
        if (exponent.length === 1 && RE.SIGN.test(exponent)) {
          throwSyntaxError(current, i, result)
        }
      }
    }

    // end of number
    if (RE.WHITESPACE.test(current)) {
      newNumber()
      state = SEP
      seenComma = false
    }
    else if (RE.COMMA.test(current)) {
      newNumber()
      state = SEP
      seenComma = true
    }
    else if (RE.SIGN.test(current)) {
      newNumber()
      state = INT
      number = current
    }
    else if (RE.POINT.test(current)) {
      newNumber()
      state = FLOAT
      number = current
    }
    else {
      throwSyntaxError(current, i, result)
    }
  }

  // add the last number found (if any)
  newNumber()

  return result
}
