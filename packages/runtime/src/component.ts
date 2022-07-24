import { hasOwn, isFunction, isObject, NOOP } from '@my-vue/shared'
import { LifeCycleHooks } from './componentLifeCycle'
import { initProps } from './componentProps'
import { initSlots } from './componentSlots'
import { VNode } from './vnode'

export let currentInstance: ComponentInternalInstance | undefined

export function setCurrentInstace(instance: ComponentInternalInstance | undefined) {
  currentInstance = instance
}

export function getCurrentInstance() {
  return currentInstance
}

export interface ComponentInternalInstance {
  vnode: VNode
  // 组件渲染的内容
  subTree?: VNode
  isMounted: boolean
  update?: () => void
  propsOptions: Record<string, any>
  props?: Record<string, any>
  attrs?: Record<string, any>
  proxy?: any
  render?: () => VNode
  next?: VNode
  data?: Record<string, any>
  setupState?: Record<string, any>
  slots?: Record<string, (...args: any[]) => VNode>
  parentComponent?: ComponentInternalInstance
  provides: Record<string, any>
  [LifeCycleHooks.BEFORE_MOUNT]?: Function[]
  [LifeCycleHooks.MOUNTED]?: Function[]
  [LifeCycleHooks.BEFORE_UNMOUNT]?: Function[]
  [LifeCycleHooks.UNMOUNTED]?: Function[]
}

/**
 * 创建组件实例
 */
export function createComponentInstance(vnode: VNode, parentComponent?: ComponentInternalInstance) {
  const { props: propsOptions = {} } = vnode.type as any
  // 组件实例
  const instance: ComponentInternalInstance = {
    vnode,
    isMounted: false,
    propsOptions,
    parentComponent,
    provides: parentComponent ? { ...parentComponent.provides } :  {}
  }
  vnode.component = instance
  return instance
}

const publicPropertyMap: Record<string | symbol, (ins: ComponentInternalInstance) => any> = {
  $attrs: (ins: ComponentInternalInstance) => ins.attrs,
  $slots: (ins: ComponentInternalInstance) => ins.slots
}

/**
 * 组件实例的 ProxyHandler，用于直接通过 this 来访问 data 和 props
 */
const publicInstanceProxy: ProxyHandler<any> = {
  get(target: ComponentInternalInstance, key) {
    const { props, setupState } = target
    if (setupState && hasOwn(setupState, key)) {
      return setupState[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    }

    const getter = publicPropertyMap[key]
    if (getter) return getter(target)

    return undefined
  },
  set(target: ComponentInternalInstance, key, value) {
    const { props, setupState } = target
    if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value
      return true
    } else if (props && hasOwn(props, key)) {
      console.warn('不允许修改属性')
      return false
    }
    return false
  },
}

/**
 * 初始化组件 props、生成代理
 */
export function setupComponent(instance: ComponentInternalInstance) {
  const { setup } = instance.vnode.type as any
  
  initProps(instance)
  initSlots(instance)
  instance.proxy = new Proxy(instance, publicInstanceProxy)
  instance.render = (instance.vnode.type as any).render || NOOP
  
  if (setup) {
    currentInstance = instance
    const setupContext = {
      emit(rawName: string, ...args: any[]) {
        // xx => onXx
        const eventName = `on${rawName[0].toUpperCase()}${rawName.slice(1)}`

        if (instance.vnode.props && (eventName in instance.vnode.props)) {
          (instance.vnode.props[eventName] as Function)(...args)
        }
      },
      slots: instance.slots
    }
    const setupResult = setup.call(null, instance.props, setupContext)
    currentInstance = undefined
    if (isFunction(setupResult)) {
      // render 函数
      instance.render = setupResult
    } else if (isObject(setupResult)) {
      instance.setupState = setupResult
    }
  }
}
