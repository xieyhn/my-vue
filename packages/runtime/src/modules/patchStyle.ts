import { isArray, isString } from "@my-vue/shared"

export type Style = string | Record<string, string | string[]> | null

export function patchStyle(el: HTMLElement, preValue: Style, nextValue: Style) {
  const style = el.style

  if (nextValue && !isString(nextValue)) {
    for(const key in nextValue) {
      setStyle(style, key, nextValue[key])
    }

    // 清除历史
    if (preValue && !isString(preValue)) {
      for(const key in preValue) {
        if (!(key in nextValue)) {
          setStyle(style, key, '')
        }
      }
    }
  } else if (isString(nextValue)) {
    style.cssText = nextValue
  }
}

function setStyle(style: CSSStyleDeclaration, name: string, val: string | string[]) {
  if (isArray(val)) {
    val.forEach(k => setStyle(style, name, k))
  } else {
    if (name.startsWith('--')) {
      // css 变量
      style.setProperty(name, val)
    } else {
      style[name as any] = val
    }
  }
}
