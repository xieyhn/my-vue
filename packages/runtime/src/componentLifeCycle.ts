import { ComponentInternalInstance, currentInstance, getCurrentInstance, setCurrentInstace } from "./component"

export const enum LifeCycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UNMOUNT = 'bu',
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
export const onBeforeUnmount = createHook(LifeCycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifeCycleHooks.UNMOUNTED)
