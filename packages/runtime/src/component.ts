import { VNode } from './vnode'

export interface ComponentInstance {
  state: Record<string, any>
  vnode: VNode
  // 组件渲染的内容
  subTree?: VNode
  isMounted: boolean
  update?: () => void
  propsOptions: Record<string, any>
  props?: Record<string, any>
  attrs?: Record<string, any>
  proxy?: any
}
