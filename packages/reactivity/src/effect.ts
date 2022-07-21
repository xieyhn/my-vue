import { Dep } from './dep'

type KeyToDepMap = Map<any, Set<ReactiveEffect>>

export type EffectScheduler = (...args: any[]) => any

const targetMap = new WeakMap<any, KeyToDepMap>()

export let activeEffect: ReactiveEffect | undefined
export let shouldTrack = true

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
    private fn: () => T,
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

export function trigger(target: object, key: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (!dep) return
  triggerEffects(dep)
}

export function trackEffects(dep: Dep) {
  if (activeEffect) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
} 

export function triggerEffects(dep: Dep) {
  ;[...dep].forEach(effect => {
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
  const _effect = new ReactiveEffect(fn)

  _effect.run()
}

function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect

  deps.forEach(dep => {
    dep.delete(effect)
  })

  deps.length = 0
}