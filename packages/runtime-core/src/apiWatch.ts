import { ComputedRef, isReactive, isRef, ReactiveEffect, Ref } from '@my-vue/reactivity';
import { EMPTY_OBJ, isArray, isFunction, isObject, isPlainObject, NOOP } from '@my-vue/shared';

export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T) | object

export type WatchCallback<V = any> = (
  value: V,
  oldValue: V | undefined,
  onCleanup: OnCleanup
) => any

type OnCleanup = (cleanupFn: () => void) => void

export interface WatchOptionsBase {
  flush?: 'pre' | 'post' | 'sync'
}

export interface WatchOptions extends WatchOptionsBase {
  immediate?: boolean
  deep?: boolean
}

export type WatchStopHandle = () => void

export function watch<T>(
  source: WatchSource<T>,
  cb: WatchCallback<T>,
  options?: WatchOptions
): WatchStopHandle {
  let { deep, immediate } = options || EMPTY_OBJ
  let getter: () => any

  if (isRef(source)) {
    getter =  () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (isFunction(source)) {
    getter = source
  } else {
    getter = NOOP
  }

  if (deep) {
    // 如果是深层监听，则需要遍历对象访问每一个属性，即收集到对象的每一个属性的依赖
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  let cleanup: () => void
  let onCleanup: OnCleanup = (fn: () => void) => {
    cleanup = fn
  }
  
  let oldValue: T

  const job = () => {
    if (!effect.active) return
    if (cleanup) cleanup()
    const newValue = effect.run()
    cb(newValue, oldValue, onCleanup)
    oldValue = newValue
  } 

  const effect = new ReactiveEffect(getter, job)

  if (immediate) {
    job()
  } else {
    oldValue = effect.run()
  }

  return () => {
    effect.stop()
  }
}

export function traverse(value: unknown, seen: Set<unknown> = new Set()) {
  if (!isObject(value)) {
    return value
  }

  // 防止循环引用
  if (seen.has(value)) {
    return value
  }

  seen.add(value)

  if (isRef(value)) {
    traverse(value.value, seen)
  } else if (isArray(value)) {
    for(let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (isPlainObject(value)) {
    for(let key in value) {
      traverse((value as any)[key], seen)
    }
  }
  
  return value
}
