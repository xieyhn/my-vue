import { patchAttr } from './modules/patchAttrs'
import { patchClass } from './modules/patchClass'
import { patchEvent } from './modules/patchEvents'
import { patchStyle } from './modules/patchStyle'

export function patchProp(
  el: HTMLElement, 
  key: string, 
  preValue: unknown,
  nextValue: unknown
) {
  if (key === 'class') {
    patchClass(el, nextValue as any)
  } else if (key === 'style') {
    patchStyle(el, preValue as any, nextValue as any)
  } else if (/^on/.test(key)) {
    patchEvent(el, key, preValue as any, nextValue as any)
  } else {
    patchAttr(el, key, nextValue)
  }
}
