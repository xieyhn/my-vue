import { ReactiveEffect, trackEffects, triggerEffects } from "./effect";
import { Dep } from './dep'

export type ComputedGetter<T> = (...args: any[]) => T

class ComputedRefImpl<T> {
  public dep: Dep = new Set()

  private _value!: T
  private readonly effect: ReactiveEffect

  public _dirty = true
  
  constructor(getter: ComputedGetter<T>) {
    this.effect = new ReactiveEffect(getter, () => {
      this._dirty = true
      triggerEffects(this.dep)
    })
  }

  get value() {
    trackEffects(this.dep)
    if (this._dirty) {
      this._value = this.effect.run()
      this._dirty = false
    }
    return this._value
  }
}

export function computed<T>(fn: () => T) {
  return new ComputedRefImpl(fn)
}
