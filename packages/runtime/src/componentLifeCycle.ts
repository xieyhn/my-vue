import { ComponentInternalInstance, getCurrentInstance, setCurrentInstace } from "./component"

export const enum LifeCycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'u'
}

function createHook(type: LifeCycleHooks) {
  return (cb: Function) => {
    const instance = getCurrentInstance()
    if (instance) {
      if (!instance[type]) {
        instance[type] = []
      }
      instance[type]!.push(cb)
    }
  }
}

export function callLifeCycleHook(instance: ComponentInternalInstance, type: LifeCycleHooks) {
  const hooks = instance[type]
  if (hooks) {
    setCurrentInstace(instance)
    hooks.forEach(hook => hook())
    setCurrentInstace(undefined)
  }
}

export const onBeforeMount = createHook(LifeCycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifeCycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifeCycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifeCycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifeCycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifeCycleHooks.UNMOUNTED)
