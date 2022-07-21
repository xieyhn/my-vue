import { hasOwn, isArray, isObject } from '@my-vue/shared';
import { pauseTracking, resetTracking, track, trigger } from './effect'
import { reactive, ReactiveFlags, Target, toRaw } from './reactive'

const arrayInstrumentations = createArrayInstrumentations()

function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this)
      // 收集 length 依赖
      const l = this.length
      for(let i = 0; i < l; i++) {
        // 收集每一项作为依赖
        track(arr, i + '')
      }
      return (arr as any)[key](...args)
    }
  })

  // push 方法会访问 length 属性，因此运行此类方法时，需要暂停收集
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      pauseTracking()
      const res = (toRaw(this) as any)[key].apply(this, args)
      resetTracking()
      return res
    }
  })

  return instrumentations
}

function createGetter() {
  return function get(target: Target, key: string, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    } else if (key === ReactiveFlags.RAW) {
      return target
    }
    if (isArray(target) && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }
    const res = Reflect.get(target, key, receiver)
    track(target, key)
    return isObject(res) ? reactive(res) : res
  }
}

function createSetter() {
  return function set(target: Target, key: string | symbol, value: unknown, receiver: object) {
    const res = Reflect.set(target, key, toRaw(value), receiver)
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
