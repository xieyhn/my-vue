import { track, trigger } from './effect'
import { ReactiveFlags, Target } from './reactive'

function createGetter() {
  return function get(target: Target, key: string, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    const res = Reflect.get(target, key, receiver)
    track(target, key)
    return res
  }
}

function createSetter() {
  return function set(target: Target, key: string | symbol, value: unknown, receiver: object) {
    const res = Reflect.set(target, key, value, receiver)
    trigger(target, key)
    return res
  }
}

const get = createGetter()
const set = createSetter()

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
}
