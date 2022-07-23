import { ComputedRef, EffectScheduler, isReactive, isRef, ReactiveEffect, Ref } from '@my-vue/reactivity';
import { EMPTY_OBJ, hasChanged, isArray, isFunction, isObject, isPlainObject, NOOP } from '@my-vue/shared';
import { queuePostFlushCb, queuePreFlushCb } from './scheduler';

export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | ((onCleanup: OnCleanup) => T) | T

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

export type WatchEffect = (onCleanup: OnCleanup) => void

export function watch<T>(
  source: WatchSource<T>,
  cb: WatchCallback<T>,
  options?: WatchOptions
): WatchStopHandle {
  return doWatch(source, cb, options)
}

export function watchEffect(
  effect: WatchEffect,
  options?: WatchOptionsBase
): WatchStopHandle {
  return doWatch(effect, null, options)
}

export function watchPostEffect(effect: WatchEffect) {
  return doWatch(effect, null, { flush: 'post' })
}

export function watchPreEffect(effect: WatchEffect) {
  return doWatch(effect, null, { flush: 'pre' })
}

function doWatch<T>(
  source: WatchSource<T>,
  cb: WatchCallback<T> | null,
  { deep, immediate, flush } : WatchOptions = EMPTY_OBJ
) {
  let getter: () => any
  let cleanup: () => void
  let onCleanup: OnCleanup = (fn: () => void) => {
    // effect.onStop 在 effect 停止监听时，也要触发一次 cleanup
    cleanup = effect.onStop = fn
  }

  if (isRef(source)) {
    getter =  () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (isFunction(source)) {
    getter = () => source(onCleanup) 
  } else {
    getter = NOOP
  }

  if (deep) {
    // 如果是深层监听，则需要遍历对象访问每一个属性，即收集到对象的每一个属性的依赖
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }
  
  let oldValue: T

  const job = () => {
    if (!effect.active) return
    if (cleanup) cleanup()
    
    if (cb) {
      const newValue = effect.run()
      // 变化后才触发，deep 时也触发，无法比较同一个对象
      if (deep || hasChanged(newValue, oldValue)) {
        cb(newValue, oldValue, onCleanup)
      }
      oldValue = newValue
    } else {
      // 没有传递回调的情况，是 watchEffect 使用方式
      effect.run()
    }
  }

  let scheduler: EffectScheduler

  // sync 立即同步执行，不放在下一事件循环
  if (flush === 'sync') {
    scheduler = job
  } else if (flush === 'post') {
    // post 在 dom 更新后
    scheduler = () => queuePostFlushCb(job)
  } else {
    // 默认值 pre，在 dom 更新前
    scheduler = () => queuePreFlushCb(job)
  }

  const effect = new ReactiveEffect(getter, scheduler)

  if (immediate) {
    job()
  } else {
    oldValue = effect.run()
  }

  return () => {
    effect.stop()
  }
}

function traverse(value: unknown, seen: Set<unknown> = new Set()) {
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
