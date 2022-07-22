import { ReactiveEffect, trackEffects, triggerEffects } from "./effect";
import { Dep } from './dep'
import { isFunction, NOOP } from "@my-vue/shared";

export type ComputedGetter<T> = (...args: any[]) => T
export type ComputedSetter<T> = (v: T) => void

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

export class ComputedRefImpl<T> {
  public dep: Dep = new Set()

  private _value!: T
  public readonly effect: ReactiveEffect

  public _dirty = true

  public readonly __v_isRef = true
  
  constructor(getter: ComputedGetter<T>, private readonly _setter: ComputedSetter<T>) {
    this.effect = new ReactiveEffect(getter, () => {
      this._dirty = true
      triggerEffects(this.dep)
    })
    this.effect.computed = this
  }

  get value() {
    trackEffects(this.dep)
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }

  set value(newValue: T) {
    this._setter(newValue)
  }
}

export function computed<T>(getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    setter = NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedRefImpl(getter, setter)
}
