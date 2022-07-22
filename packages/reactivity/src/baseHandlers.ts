import { hasChanged, hasOwn, isArray, isIntegerKey, isObject } from '@my-vue/shared';
import { ITERATE_KEY, pauseTracking, resetTracking, track, trigger } from './effect'
import { TriggerOpTypes } from './operations';
import { reactive, ReactiveFlags, Target, toRaw } from './reactive'
import { isRef } from './ref';

const arrayInstrumentations = createArrayInstrumentations()

function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this)

      // 使用 proxy 调用 indexOf 方法会触发 length 及每个索引的更新
      // 但此时是拿到源对象来执行的方法，因此需要手动收集每个元素及 length 的依赖
      const l = this.length
      for(let i = 0; i < l; i++) {
        // 收集每一项作为依赖
        track(arr, i + '')
      }

      const res = (arr as any)[key](...args)
      if (res === -1 || res === false) {
        return (arr as any)[key](...args.map(toRaw))
      } else {
        return res
      }
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

    const targetIsArray = isArray(target)

    if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }
    const res = Reflect.get(target, key, receiver)
    track(target, key)

    if (isRef(res)) {
        // 数组里面的 ref 不解包
        return targetIsArray && isIntegerKey(key) ? res : res.value;
    }

    return isObject(res) ? reactive(res) : res
  }
}

function createSetter() {
  return function set(target: Target, key: string | symbol, value: unknown, receiver: object) {
    const oldValue = (target as any)[key]

    if (!hasChanged(oldValue, value)) {
      return true
    }

    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value
      return true
    }

    const hadKey = isArray(target) && isIntegerKey(key) 
      ? +(key as string) < (target as unknown[]).length
      : hasOwn(target, key)

    const res = Reflect.set(target, key, toRaw(value), receiver)

    trigger(target, hadKey ? TriggerOpTypes.SET: TriggerOpTypes.ADD, key, value, oldValue)

    return res
  }
}

function createDeleteProperty() {
  return function deleteProperty(target: object, key: string | symbol) {
    const res = Reflect.deleteProperty(target, key)
    trigger(target, TriggerOpTypes.DELETE, key)
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
