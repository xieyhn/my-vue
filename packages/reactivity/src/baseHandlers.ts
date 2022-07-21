import { hasChanged, hasOwn, isArray, isIntegerKey, isObject } from '@my-vue/shared';
import { ITERATE_KEY, pauseTracking, resetTracking, track, trigger } from './effect'
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
    const oldValue = (target as any)[key]

    if (!hasChanged(oldValue, value)) {
      return true
    }

    let keys = new Set<string | symbol>([key])

    if (isArray(target)) {
      const { length } = (target as unknown[])
      if (isIntegerKey(key) && +(key as string) >= length) {
        keys.add('length')
        for(let i = 0; i < length; i++) {
          keys.add(i + '')
        }
      }
    } else if (!hasOwn(target, key)) {
      // 新增属性，触发记录的自定义 key： ITERATE_KEY，即处理 in 操作符遍历对象
      keys.add(ITERATE_KEY)
    }

    const res = Reflect.set(target, key, toRaw(value), receiver)

    // TODO: 触发时需要去重
    keys.forEach(key => {
      trigger(target, key)
    })

    return res
  }
}

function createDeleteProperty() {
  return function deleteProperty(target: object, key: string | symbol) {
    const res = Reflect.deleteProperty(target, key)
    trigger(target, key)
    return res
  }
}

function createHas() {
  return function has(target: object, key: string | symbol) {
    track(target, key)
    return Reflect.has(target, key)
  }
}

const get = createGetter()
const set = createSetter()
const deleteProperty = createDeleteProperty()
const has = createHas()

function ownKeys(target: object) {
  track(target, ITERATE_KEY)
  return Reflect.ownKeys(target)
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
