import { hasOwn } from '@my-vue/shared'
import { initProps } from './componentProps'
import { VNode } from './vnode'

export interface ComponentInternalInstance {
  data: Record<string, any>
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
}

/**
 * 常见组件实例
 */
export function createComponentInstance(vnode: VNode) {
  const { setup, props: propsOptions } = vnode.type as any
  const data = (setup && setup()) || {}

  // 组件实例
  const instance: ComponentInternalInstance = {
    data,
    vnode,
    isMounted: false,
    propsOptions
  }

  vnode.component = instance

  return instance
}

const publicPropertyMap: Record<string | symbol, (ins: ComponentInternalInstance) => any> = {
  $attrs: (ins: ComponentInternalInstance) => ins.attrs
}

const publicInstanceProxy: ProxyHandler<any> = {
  get(target, key) {
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      return data[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    }

    const getter = publicPropertyMap[key]
    if (getter) return getter(target)

    return undefined
  },
  set(target, key, value) {
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      data[key] = value
      return true
    } else if (props && hasOwn(props, key)) {
      console.warn('不允许修改属性')
      return false
    }
    return false
  },
}

export function setupComponent(instance: ComponentInternalInstance) {
  initProps(instance)
  instance.proxy = new Proxy(instance, publicInstanceProxy)
  instance.render = (instance.vnode.type as any).render
}
