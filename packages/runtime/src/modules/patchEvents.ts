import { hyphenate, isFunction } from "@my-vue/shared"

type EventValue = Function | Function[]

interface Invoker extends EventListener {
  value: EventValue
}

export function addEventListener(
  el: HTMLElement,
  event: string,
  handler: EventListener,
) {
  el.addEventListener(event, handler)
}

export function removeEventListener(
  el: Element,
  event: string,
  handler: EventListener,
) {
  el.removeEventListener(event, handler)
}

export function patchEvent(
  el: HTMLElement & { _vei?: Record<string, Invoker | undefined> },
  rawName: string,
  preValue: EventValue | null,
  nextValue: EventValue | null
) {
  // vei = vue event invokers
  const invokers = el._vei || (el._vei = {})
  const existingInvoker = invokers[rawName]

  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue
  } else {
    // 小驼峰转横线命名
    const name = hyphenate(rawName.slice(2))
    if (nextValue) {
      // add
      const invoker = createInvoker(nextValue)
      invokers[rawName] = invoker
      addEventListener(el, name, invoker)
    } else {
      // remove 
      removeEventListener(el, name, existingInvoker!)
      invokers[rawName] = undefined
    }
  }
}

function createInvoker(initialValue: EventValue): Invoker {
  const invoker: Invoker = (e: Event) => {
    if (isFunction(invoker.value)) {
      invoker.value(e)
    } else {
      invoker.value.forEach(v => v(e))
    }
  }

  invoker.value = initialValue
  return invoker
}