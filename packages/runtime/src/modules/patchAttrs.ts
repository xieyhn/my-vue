export function patchAttr(el: HTMLElement, key: string, value: any) {
  if (!value) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
