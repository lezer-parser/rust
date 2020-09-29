import {ExternalTokenizer} from "lezer"
import {Float, RawString, closureParamDelim} from "./parser.terms"

const _b = 98, _e = 101, _f = 102, _r = 114, _E = 69,
  Dot = 46, Plus = 43, Minus = 45, Hash = 35, Quote = 34, Pipe = 124

function isNum(ch) { return ch >= 48 && ch <= 57 }
function isNum_(ch) { return isNum(ch) || ch == 95 }

export const tokens = new ExternalTokenizer((input, token, stack) => {
  let pos = token.start, next = input.get(pos)
  if (isNum(next)) {
    let isFloat = false
    do { next = input.get(++pos) } while (isNum_(next))
    if (next == Dot) {
      isFloat = true
      next = input.get(++pos)
      if (isNum(next)) {
        do { next = input.get(++pos) } while (isNum_(next))
      } else if (next == Dot || next > 0x7f || /\w/.test(String.fromCharCode(next))) {
        return
      }
    }
    if (next == _e || next == _E) {
      isFloat = true
      next = input.get(++pos)
      if (next == Plus || next == Minus) next = input.get(++pos)
      let startNum = pos
      while (isNum_(next)) next = input.get(++pos)
      if (pos == startNum) return
    }
    if (next == _f) {
      if (!/32|64/.test(input.read(pos + 1, pos + 3))) return
      isFloat = true
      pos += 3
    }
    if (isFloat) token.accept(Float, pos)
  } else if (next == _b || next == _r) {
    if (next == _b) next = input.get(++pos)
    if (next != _r) return
    next = input.get(++pos)
    let count = 0
    while (next == Hash) { count++; next = input.get(++pos) }
    if (next != Quote) return
    next = input.get(++pos)
    content: for (;;) {
      if (next < 0) return
      let isQuote = next == Quote
      next = input.get(++pos)
      if (isQuote) {
        for (let i = 0; i < count; i++) {
          if (next != Hash) continue content
          next = input.get(++pos)    
        }
        token.accept(RawString, pos)
        return
      }
    }
  } else if (next == Pipe && stack.canShift(closureParamDelim)) {
    token.accept(closureParamDelim, pos + 1)
  }
})
