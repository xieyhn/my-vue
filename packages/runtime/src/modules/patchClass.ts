import { isString } from "@my-vue/shared"

export function patchClass(el: HTMLElement, value: string | null | Record<string, boolean>) {
  if (!value) {
    el.removeAttribute('class')
  } else if (isString(value)) {
    el.className = value
  } else {
    const classNames: string[] = []

    Object.entries(value).forEach(([key, val]) => {
      if (val) {
        classNames.push(key)
      }
    })

    el.className = classNames.join(' ')
  }
}
