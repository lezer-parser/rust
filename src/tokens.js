import {ExternalTokenizer} from "lezer"
import {Float, RawString} from "./parser.terms"

const _b = 98, _e = 101, _f = 102, _r = 114, _E = 69,
  Dot = 46, Plus = 43, Minus = 45, Hash = 35, Quote = 34

function isNum(ch) { return ch >= 48 && ch <= 57 }
function isNum_(ch) { return isNum(ch) || ch == 95 }

export const tokens = new ExternalTokenizer((input, token) => {
  let pos = token.start, next = input.get(pos)
  if (isNum(next)) {
    do { next = input.get(++pos) } while (isNum_(next))
    if (next == Dot) {
      isFloat = true
      next = input.get(++pos)
      if (isNum(next)) {
        do { next = input.get(++pos) } while (isNum_(next))
      } else if (next == Dot || (next < 0x7f && !/\w/.test(String.fromCharCode(next)))) {
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
    if (next == _b) next = input.read(++pos)
    if (next != _r) return
    next = input.read(++pos)
    let count = 0
    while (next == Hash) { count++; next = input.read(++pos) }
    if (next != Quote) return
    next = input.read(++pos)
    for (let stop = false; !stop;) {
      if (next < 0) return
      stop = next == Quote
      next = input.read(++pos)
    }
    for (let i = 0; i < count; i++) {
      if (next != Hash) return
      next = input.read(++pos)
    }
    token.accept(RawString, pos)
  }
})
