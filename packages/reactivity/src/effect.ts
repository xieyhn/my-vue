type KeyToDepMap = Map<any, Set<ReactiveEffect>>

const targetMap = new WeakMap<any, KeyToDepMap>()

export let activeEffect: ReactiveEffect | undefined

export class ReactiveEffect<T = any> {
  deps: Set<ReactiveEffect>[] = []
  parent : ReactiveEffect | undefined = undefined

  constructor(private fn: () => T, ) {}

  run() {
    if (activeEffect) {
      this.parent = activeEffect
    }
    activeEffect = this
    cleanupEffect(this)
    this.fn()
    activeEffect = this.parent
    this.parent = undefined
  }
}

export function track(target: object, key: unknown) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

export function trigger(target: object, key: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (!dep) return
  dep.forEach(effect => effect.run())
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