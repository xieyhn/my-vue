import { isArray } from '@my-vue/shared'
import { Dep } from './dep'
import { TriggerOpTypes } from './operations'

type KeyToDepMap = Map<any, Set<ReactiveEffect>>

export type EffectScheduler = (...args: any[]) => any

export interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

const targetMap = new WeakMap<any, KeyToDepMap>()

export let activeEffect: ReactiveEffect | undefined
export let shouldTrack = true
export const ITERATE_KEY = Symbol('iterate')

export function pauseTracking() {
  shouldTrack = false
}

export function resetTracking() {
  shouldTrack = true
}

export class ReactiveEffect<T = any> {
  deps: Dep[] = []
  parent : ReactiveEffect | undefined = undefined

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null,
  ) {}

  run() {
    try {
      this.parent = activeEffect
      activeEffect = this
      shouldTrack = true
      cleanupEffect(this)
      return this.fn()
    } finally {
      activeEffect = this.parent
      this.parent = undefined
    }
  }
}

export function track(target: object, key: unknown) {
  if (shouldTrack && activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    trackEffects(dep)
  }
}

export function trigger(target: object, type: TriggerOpTypes, key: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const deps: (Dep | undefined)[] = []
  deps.push(depsMap.get(key))

  if (type === TriggerOpTypes.ADD) {
    if (isArray(target)) {
      deps.push(depsMap.get('length'))
    } else {
      deps.push(depsMap.get(ITERATE_KEY))
    }
  }

  // 遍历添加并去重
  const dep: Dep = new Set()
  deps.forEach(_dep => {
    if (!_dep) return
    _dep.forEach(v => dep.add(v))
  })
  
  triggerEffects(dep)
}

export function trackEffects(dep: Dep) {
  if (activeEffect) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
} 

export function triggerEffects(dep: Dep) {
  dep.forEach(effect => {
    if (activeEffect !== effect) {
      if (effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run()
      }
    }
  })
}

export function effect(fn: () => any) {
  const _effect = (fn as ReactiveEffectRunner).effect || new ReactiveEffect(fn)

  _effect.run()

  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}

function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect

  deps.forEach(dep => {
    dep.delete(effect)
  })

  deps.length = 0
}