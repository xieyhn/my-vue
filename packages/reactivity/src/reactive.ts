import { isObject } from '@my-vue/shared'
import { mutableHandlers } from './baseHandlers'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  RAW = '__v_raw'
}

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.RAW]?: any
}

export const reactiveMap = new WeakMap<Target, any>()

function createReactiveObject(
  target: Target,
  proxyMap: WeakMap<Target, any>
) {
  if (!isObject(target)) {
    console.warn('target 必须是一个对象')
    return target
  }

  // 传递的是已经代理过的 proxy
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  // 判断 target 是否已有对应的 Proxy
  const existingProxy = proxyMap.get(target)
  if (existingProxy) return existingProxy

  const proxy = new Proxy(target, mutableHandlers)
  proxyMap.set(target, proxy)
  
  return proxy
}

export function reactive<T extends object>(target: T): T {
  return createReactiveObject(target, reactiveMap)
}

export function isReactive(value: unknown) {
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])
}

export function toRaw<T>(value: T): T {
  const raw = value && (value as Target)[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : value
}
